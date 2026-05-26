import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import type { UserRole } from "../domain/roles.js";
import { AppError } from "./error-handler.js";

type JwtPayload = {
  sub: string;
  role: UserRole;
};

export function ensureAuthenticated(request: Request, _response: Response, next: NextFunction) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    throw new AppError(401, "Token ausente");
  }

  const token = authorization.replace("Bearer ", "");

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    request.user = {
      id: payload.sub,
      role: payload.role
    };
    next();
  } catch {
    throw new AppError(401, "Token inválido");
  }
}

export function requireRole(...roles: UserRole[]) {
  return (request: Request, _response: Response, next: NextFunction) => {
    if (!request.user || !roles.includes(request.user.role)) {
      throw new AppError(403, "Acesso negado");
    }

    next();
  };
}
