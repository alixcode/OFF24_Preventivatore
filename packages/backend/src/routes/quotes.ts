import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";
import { calculateRisk } from "@off24/shared";

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

// Genera PDF (placeholder — integrazione Puppeteer in Fase 2)
quotesRouter.get("/:id/pdf", requireAuth, async (req, res, next) => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
    });
    if (!quote) throw createError("Preventivo non trovato", 404);

    res.json({ message: "PDF generation — da implementare in Fase 2", quoteId: quote.id });
  } catch (err) {
    next(err);
  }
});
