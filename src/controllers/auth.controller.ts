// Libs
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";

// Schemas
import { loginSchema, registerSchema } from "../schemas/auth.schemas.js";

// Utils
import { AppError } from "../middlewares/error-handler.js";
import { env } from "../config/env.js";

class AuthController {
  async register(request: Request, response: Response) {
    const input = registerSchema.parse(request.body);

    const emailAlreadyUsed = await prisma.user.findUnique({
      where: { email: input.email },
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
        role: input.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return response.status(201).json({ user });
  }

  async login(request: Request, response: Response) {
    const input = loginSchema.parse(request.body);

    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new AppError(401, "Credenciais inválidas");
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(401, "Credenciais inválidas");
    }

    const token = jwt.sign({ role: user.role }, env.JWT_SECRET, {
      subject: user.id,
      expiresIn: "7d",
    });

    return response.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  }
}

export { AuthController };
