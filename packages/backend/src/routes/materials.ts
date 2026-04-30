import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";
import { PRICE_VALIDITY_DAYS } from "@off24/shared";

export const materialsRouter = Router();
materialsRouter.use(requireAuth);

// Lista materiali con flag scaduti
materialsRouter.get("/", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const expiryThreshold = new Date();
    expiryThreshold.setDate(expiryThreshold.getDate() - PRICE_VALIDITY_DAYS);

    const materials = await prisma.material.findMany({
      where: { companyId, isActive: true },
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    const withExpiry = materials.map((m: typeof materials[number]) => ({
      ...m,
      isPriceExpired: m.priceUpdatedAt < expiryThreshold,
    }));

    res.json(withExpiry);
  } catch (err) {
    next(err);
  }
});

// Aggiorna prezzo materiale
materialsRouter.put("/:id/price", async (req, res, next) => {
  try {
    const schema = z.object({
      price: z.number().positive(),
      supplierId: z.string().optional(),
      notes: z.string().optional(),
    });
    const { price, supplierId, notes } = schema.parse(req.body);
    const companyId = req.user!.companyId;

    const material = await prisma.material.findFirst({
      where: { id: req.params.id, companyId },
    });
    if (!material) throw createError("Materiale non trovato", 404);

    const [updated] = await prisma.$transaction([
      prisma.material.update({
        where: { id: material.id },
        data: { currentPrice: price, priceUpdatedAt: new Date() },
      }),
      prisma.materialPrice.create({
        data: { materialId: material.id, price, supplierId, notes },
      }),
    ]);

    res.json(updated);
  } catch (err) {
    next(err);
  }
});
