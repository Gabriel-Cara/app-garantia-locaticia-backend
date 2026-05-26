import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { env } from "../config/env.js";
import { UserRole } from "../domain/roles.js";
import { prisma } from "../lib/prisma.js";
import { AppError } from "../middlewares/error-handler.js";

export const authRoutes = Router();

const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum([UserRole.ADMIN, UserRole.REAL_ESTATE]).default(UserRole.REAL_ESTATE)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

authRoutes.post("/register", async (request, response) => {
  const input = registerSchema.parse(request.body);

  const emailAlreadyUsed = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (emailAlreadyUsed) {
    throw new AppError(409, "Email já cadastrado");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);

  const user = await prisma.user.create({
    data: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true
    }
  });

  return response.status(201).json({ user });
});

authRoutes.post("/login", async (request, response) => {
  const input = loginSchema.parse(request.body);

  const user = await prisma.user.findUnique({
    where: { email: input.email }
  });

  if (!user) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordMatches) {
    throw new AppError(401, "Credenciais inválidas");
  }

  const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
    subject: user.id,
    expiresIn: "7d"
  });

  return response.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});
