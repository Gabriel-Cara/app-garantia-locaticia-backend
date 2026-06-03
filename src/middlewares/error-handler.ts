import type { ErrorRequestHandler } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next,
) => {
  if (error instanceof ZodError) {
    return response.status(400).json({
      error: true,
      message: "Validation error",
      code: "VALIDATION_ERROR",
      issues: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    return response.status(error.statusCode).json({
      error: true,
      message: error.message,
      code: error.code,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      const target = Array.isArray(error.meta?.target)
        ? error.meta.target
        : [];

      if (target.includes("document")) {
        return response.status(409).json({
          error: true,
          code: "DOCUMENT_ALREADY_CONSULTED",
          message:
            "Este CPF/CNPJ já possui uma consulta cadastrada. Não é permitido consultar o mesmo documento novamente.",
        });
      }

      return response.status(409).json({
        error: true,
        code: "DUPLICATED_RECORD",
        message: "Já existe um registro cadastrado com essas informações.",
      });
    }
  }

  console.error(error);

  return response.status(500).json({
    error: true,
    code: "INTERNAL_SERVER_ERROR",
    message: "Internal server error",
  });
};