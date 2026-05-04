import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

export const jobsRouter = Router();

jobsRouter.use(requireAuth);

// ─────────────────────────────────────────
// Schemi Zod
// ─────────────────────────────────────────

const jobCreateSchema = z.object({
  quoteId: z.string(),
  startDate: z.string().datetime({ offset: true }).optional(),
});

const jobStatusSchema = z.object({
  status: z.enum(["aperta", "in_lavorazione", "completata", "fatturata"]),
});

const actualCreateSchema = z.object({
  type: z.enum(["manodopera", "materiale", "costo_esterno"]),
  description: z.string().min(1),
  quantity: z.number().positive(),
  unitCost: z.number().nonnegative(),
  notes: z.string().optional(),
});

// ─────────────────────────────────────────
// GET /jobs — lista commesse
// ─────────────────────────────────────────

jobsRouter.get("/", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const { status, page = "1", pageSize = "20" } = req.query as Record<string, string>;

    const where = {
      companyId,
      ...(status ? { status: status as "aperta" | "in_lavorazione" | "completata" | "fatturata" } : {}),
    };

    const [data, total] = await Promise.all([
      prisma.job.findMany({
        where,
        include: {
          quote: {
            select: {
              id: true,
              number: true,
              costTotal: true,
              appliedPrice: true,
              appliedMargin: true,
              client: { select: { name: true } },
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (parseInt(page) - 1) * parseInt(pageSize),
        take: parseInt(pageSize),
      }),
      prisma.job.count({ where }),
    ]);

    res.json({ data, total, page: parseInt(page), pageSize: parseInt(pageSize) });
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /jobs/:id — dettaglio commessa
// ─────────────────────────────────────────

jobsRouter.get("/:id", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        actuals: { orderBy: { recordedAt: "asc" } },
        quote: {
          include: {
            client: true,
          },
        },
      },
    });

    if (!job) throw createError("Commessa non trovata", 404);
    res.json(job);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /jobs — crea commessa da preventivo
// ─────────────────────────────────────────

jobsRouter.post("/", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const body = jobCreateSchema.parse(req.body);

    // Verifica che il preventivo appartenga all'azienda
    const quote = await prisma.quote.findFirst({
      where: { id: body.quoteId, companyId },
    });
    if (!quote) throw createError("Preventivo non trovato", 404);

    // Verifica che non esista già una commessa per questo preventivo
    const existing = await prisma.job.findUnique({ where: { quoteId: body.quoteId } });
    if (existing) throw createError("Esiste già una commessa per questo preventivo", 409);

    // Genera numero progressivo COM-{year}-{nnn}
    const year = new Date().getFullYear();
    const count = await prisma.job.count({
      where: { companyId, number: { startsWith: `COM-${year}-` } },
    });
    const number = `COM-${year}-${String(count + 1).padStart(3, "0")}`;

    // Transazione: crea commessa + aggiorna status preventivo se necessario
    const job = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      if (quote.status !== "approvato") {
        await tx.quote.update({
          where: { id: body.quoteId },
          data: { status: "approvato" },
        });
      }

      return tx.job.create({
        data: {
          companyId,
          quoteId: body.quoteId,
          number,
          status: "aperta",
          startDate: body.startDate ? new Date(body.startDate) : undefined,
        },
        include: {
          quote: {
            include: { client: { select: { name: true } } },
          },
        },
      });
    });

    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// PUT /jobs/:id/status — aggiorna stato
// ─────────────────────────────────────────

jobsRouter.put("/:id/status", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const { status } = jobStatusSchema.parse(req.body);

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!job) throw createError("Commessa non trovata", 404);

    const updated = await prisma.job.update({
      where: { id: req.params.id },
      data: { status },
    });

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /jobs/:id/actuals — righe consuntivo
// ─────────────────────────────────────────

jobsRouter.get("/:id/actuals", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!job) throw createError("Commessa non trovata", 404);

    const actuals = await prisma.jobActual.findMany({
      where: { jobId: req.params.id },
      orderBy: { recordedAt: "asc" },
    });

    res.json(actuals);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// POST /jobs/:id/actuals — aggiungi riga consuntivo
// ─────────────────────────────────────────

jobsRouter.post("/:id/actuals", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const body = actualCreateSchema.parse(req.body);

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!job) throw createError("Commessa non trovata", 404);

    const total = body.quantity * body.unitCost;

    const actual = await prisma.jobActual.create({
      data: {
        jobId: req.params.id,
        type: body.type,
        description: body.description,
        quantity: body.quantity,
        unitCost: body.unitCost,
        total,
        notes: body.notes,
      },
    });

    res.status(201).json(actual);
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// DELETE /jobs/:id/actuals/:actualId — rimuovi riga
// ─────────────────────────────────────────

jobsRouter.delete("/:id/actuals/:actualId", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;

    // Verifica appartenenza commessa all'azienda
    const job = await prisma.job.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!job) throw createError("Commessa non trovata", 404);

    // Verifica che la riga esista e appartenga a questa commessa
    const actual = await prisma.jobActual.findFirst({
      where: { id: req.params.actualId, jobId: req.params.id },
    });
    if (!actual) throw createError("Riga consuntivo non trovata", 404);

    await prisma.jobActual.delete({ where: { id: req.params.actualId } });

    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// ─────────────────────────────────────────
// GET /jobs/:id/comparison — preventivo vs consuntivo
// ─────────────────────────────────────────

jobsRouter.get("/:id/comparison", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;

    const job = await prisma.job.findFirst({
      where: { id: req.params.id, companyId },
      include: {
        quote: {
          select: {
            costTotal: true,
            appliedPrice: true,
            appliedMargin: true,
          },
        },
        actuals: true,
      },
    });
    if (!job) throw createError("Commessa non trovata", 404);

    // Aggregazione consuntivo per tipo
    const byType = { manodopera: 0, materiale: 0, costo_esterno: 0 };
    let actualsTotal = 0;

    for (const actual of job.actuals) {
      actualsTotal += actual.total;
      if (actual.type === "manodopera") byType.manodopera += actual.total;
      else if (actual.type === "materiale") byType.materiale += actual.total;
      else if (actual.type === "costo_esterno") byType.costo_esterno += actual.total;
    }

    const varianceAmount = job.quote.appliedPrice - actualsTotal;
    const variancePercentage =
      job.quote.appliedPrice !== 0
        ? (varianceAmount / job.quote.appliedPrice) * 100
        : 0;

    res.json({
      quote: {
        costTotal: job.quote.costTotal,
        appliedPrice: job.quote.appliedPrice,
        appliedMargin: job.quote.appliedMargin,
      },
      actuals: {
        total: actualsTotal,
        byType,
      },
      variance: {
        amount: varianceAmount,
        percentage: Math.round(variancePercentage * 100) / 100,
      },
    });
  } catch (err) {
    next(err);
  }
});
