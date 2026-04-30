import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { PRICE_VALIDITY_DAYS } from "@off24/shared";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

// KPI mensili per la dashboard
dashboardRouter.get("/kpi", async (req, res, next) => {
  try {
    const companyId = req.user!.companyId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [currentMonth, prevMonth, activeJobs, expiredPrices] = await Promise.all([
      prisma.quote.aggregate({
        where: { companyId, createdAt: { gte: startOfMonth } },
        _count: { id: true },
        _sum: { appliedPrice: true },
        _avg: { appliedMargin: true },
      }),
      prisma.quote.aggregate({
        where: { companyId, createdAt: { gte: startOfPrevMonth, lt: startOfMonth } },
        _count: { id: true },
        _sum: { appliedPrice: true },
      }),
      prisma.job.count({
        where: { companyId, status: { in: ["aperta", "in_lavorazione"] } },
      }),
      prisma.material.count({
        where: {
          companyId,
          isActive: true,
          priceUpdatedAt: {
            lt: new Date(Date.now() - PRICE_VALIDITY_DAYS * 86_400_000),
          },
        },
      }),
    ]);

    res.json({
      currentMonth: {
        quotes: currentMonth._count.id,
        totalValue: currentMonth._sum.appliedPrice ?? 0,
        avgMargin: currentMonth._avg.appliedMargin ?? 0,
      },
      prevMonth: {
        quotes: prevMonth._count.id,
        totalValue: prevMonth._sum.appliedPrice ?? 0,
      },
      activeJobs,
      expiredPrices,
    });
  } catch (err) {
    next(err);
  }
});
