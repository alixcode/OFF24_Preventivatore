import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { createError } from "../middleware/errorHandler";

export const clientsRouter = Router();
clientsRouter.use(requireAuth);

clientsRouter.get("/", async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { companyId: req.user!.companyId },
      orderBy: { name: "asc" },
    });
    res.json(clients);
  } catch (err) {
    next(err);
  }
});

clientsRouter.post("/", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      vatNumber: z.string().optional(),
      email: z.string().email().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      notes: z.string().optional(),
    });
    const data = schema.parse(req.body);

    const client = await prisma.client.create({
      data: { companyId: req.user!.companyId, ...data, isNew: true },
    });
    res.status(201).json(client);
  } catch (err) {
    next(err);
  }
});

clientsRouter.get("/:id", async (req, res, next) => {
  try {
    const client = await prisma.client.findFirst({
      where: { id: req.params.id, companyId: req.user!.companyId },
      include: {
        quotes: {
          select: { id: true, number: true, status: true, appliedPrice: true, createdAt: true },
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });
    if (!client) throw createError("Cliente non trovato", 404);
    res.json(client);
  } catch (err) {
    next(err);
  }
});
