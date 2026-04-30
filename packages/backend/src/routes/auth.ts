import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { createError } from "../middleware/errorHandler";
import { JwtPayload } from "@off24/shared";

export const authRouter = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true },
    });

    if (!user || !user.isActive) {
      throw createError("Credenziali non valide", 401);
    }

    const passwordOk = await bcrypt.compare(password, user.passwordHash);
    if (!passwordOk) {
      throw createError("Credenziali non valide", 401);
    }

    const payload: Omit<JwtPayload, "iat" | "exp"> = {
      sub: user.id,
      email: user.email,
      companyId: user.companyId,
      role: user.role as JwtPayload["role"],
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "7d" });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company: { id: user.company.id, name: user.company.name },
      },
    });
  } catch (err) {
    next(err);
  }
});

authRouter.post("/register", async (req, res, next) => {
  try {
    const schema = z.object({
      companyName: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(8),
      name: z.string().min(2),
    });

    const { companyName, email, password, name } = schema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw createError("Email già registrata", 409);

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx: typeof prisma) => {
      const company = await tx.company.create({
        data: { name: companyName },
      });
      const user = await tx.user.create({
        data: { companyId: company.id, email, passwordHash, name, role: "admin" },
      });
      return { company, user };
    });

    res.status(201).json({
      message: "Account creato",
      companyId: result.company.id,
      userId: result.user.id,
    });
  } catch (err) {
    next(err);
  }
});
