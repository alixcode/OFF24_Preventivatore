import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";
import { calculateRisk } from "@off24/shared";
import { generateQuotePdf } from "../services/pdfService";
import type { QuotePdfData, PdfLineItem } from "../services/pdfService";

export const quotesRouter = Router();

quotesRouter.use(requireAuth);

// Lista preventivi dell'azienda
quotesRouter.get("/", async (req, res, next) => {
  try {
    const { status, page = "1", pageSize = "20" } = req.query as Record<string, string>;
    const companyId = req.user!.companyId;

    const where = { companyId, ...(status ? { status: status as any } : {}) };
    const [data, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: { client: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    next(err);
  }
});

// Dettaglio preventivo
quotesRouter.get("/:id", async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        client: true,
        createdBy: { select: { id: true, name: true } },
        versions: { orderBy: { version: "desc" }, include: { items: true } },
        approvals: { include: { user: { select: { name: true } } } },
        attachments: true,
      },
    });

    if (!quote) throw createError("Preventivo non trovato", 404);
    res.json(quote);
  } catch (err) {
    next(err);
  }
});

const quoteCreateSchema = z.object({
  clientId: z.string(),
  workCategory: z.string(),
  detailLevel: z.enum(["verbale", "foto_schizzo", "disegno_tecnico"]),
  urgency: z.enum(["normale", "urgente", "urgentissimo"]),
  initialNotes: z.string().optional(),
  material: z.string().optional(),
  complexity: z.string().optional(),
  widthMm: z.number().optional(),
  heightMm: z.number().optional(),
  depthMm: z.number().optional(),
  weightKg: z.number().optional(),
});

// Crea nuovo preventivo
quotesRouter.post("/", async (req, res, next) => {
  try {
    const data = quoteCreateSchema.parse(req.body);
    const companyId = req.user!.companyId;

    // Numero progressivo anno corrente
    const year = new Date().getFullYear();
    const count = await prisma.quote.count({
      where: { companyId, number: { startsWith: `PV-${year}-` } },
    });
    const number = `PV-${year}-${String(count + 1).padStart(3, "0")}`;

    // Calcola rischio iniziale
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    const riskResult = calculateRisk({
      missingDrawings: data.detailLevel !== "disegno_tecnico",
      inputLevelPhoto: data.detailLevel === "foto_schizzo",
      inputLevelVerbal: data.detailLevel === "verbale",
      urgencyHigh: data.urgency === "urgente",
      urgencyVeryHigh: data.urgency === "urgentissimo",
      isNewClient: client?.isNew ?? true,
      includesPosa: false,
      estimatedDimensions: data.widthMm ? 1 : 0,
    });

    const { clientId, ...rest } = data;
    const quote = await prisma.quote.create({
      data: {
        companyId,
        clientId,
        createdById: req.user!.sub,
        number,
        ...rest,
        riskCoefficient: riskResult.coefficient,
        reliabilityIndex: riskResult.reliabilityIndex,
      },
    });

    res.status(201).json(quote);
  } catch (err) {
    next(err);
  }
});

// Crea nuova versione
quotesRouter.post("/:id/version", async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: { versions: { orderBy: { version: "desc" }, take: 1 } },
    });
    if (!quote) throw createError("Preventivo non trovato", 404);

    const nextVersion = (quote.versions[0]?.version ?? 0) + 1;

    const version = await prisma.quoteVersion.create({
      data: {
        quoteId: quote.id,
        version: nextVersion,
        costTotal: req.body.costTotal ?? quote.costTotal,
        appliedPrice: req.body.appliedPrice ?? quote.appliedPrice,
        appliedMargin: req.body.appliedMargin ?? quote.appliedMargin,
        riskCoefficient: req.body.riskCoefficient ?? quote.riskCoefficient,
        changeNotes: req.body.changeNotes,
        snapshot: req.body.snapshot ?? {},
      },
    });

    res.status(201).json(version);
  } catch (err) {
    next(err);
  }
});

// Genera PDF preventivo cliente
quotesRouter.get("/:id/pdf", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;

    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        client:  true,
        company: true,
        versions: {
          orderBy: { version: "desc" },
          take: 1,
          include: { items: true },
        },
      },
    });
    if (!quote) throw createError("Preventivo non trovato", 404);

    const latestVersion = quote.versions[0];
    const revNum = latestVersion?.version ?? 1;

    // Converti righe versione → PdfLineItem (solo materiali e lavorazioni)
    type QuoteItem = NonNullable<typeof latestVersion>["items"][number];
    const items: PdfLineItem[] = (latestVersion?.items ?? [])
      .filter((i: QuoteItem) => i.type === "materiale" || i.type === "lavorazione")
      .map((i: QuoteItem) => ({
        description: i.description,
        unit:        i.unit ?? "",
        quantity:    i.quantity,
        unitPrice:   i.unitPrice,
        total:       i.total,
      }));

    const data: QuotePdfData = {
      quoteNumber:    quote.number,
      revisionNumber: revNum,
      issueDate:      new Date(quote.createdAt).toLocaleDateString("it-IT", {
        day: "numeric", month: "long", year: "numeric",
      }),
      validityDays:   quote.validityDays,

      companyName:    quote.company.name,
      companyAddress: quote.company.address ?? "Via dell'Artigianato — Italia",
      companyVat:     quote.company.vatNumber ?? "",
      companyEmail:   quote.company.email ?? "",

      clientName:     quote.client.name,
      clientAddress:  quote.client.address ?? "",
      clientVat:      quote.client.vatNumber ?? "",

      description:    quote.clientDescription ?? `${quote.workCategory} in ${quote.material ?? "ferro"} — ${quote.complexity ?? "lavorazione"} complessità`,
      items,

      subtotalNet:    quote.costTotal,
      appliedPrice:   quote.appliedPrice,
      appliedMargin:  quote.appliedMargin,

      paymentTerms:   quote.paymentTerms ?? "50% anticipato, 50% alla consegna",
      exclusions:     quote.exclusions as string[],
      notes:          "",
    };

    const pdfBuffer = await generateQuotePdf(data);

    const filename = `${quote.number.replace(/[^a-zA-Z0-9-]/g, "_")}_Rev${revNum}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
});
