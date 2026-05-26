import { Router } from "express";
import { z } from "zod";
import { AnalysisStatus, UserRole } from "../domain/roles.js";
import { prisma } from "../lib/prisma.js";
import { ensureAuthenticated, requireRole } from "../middlewares/auth.js";
import { AppError } from "../middlewares/error-handler.js";
import { oragoClient } from "../services/orago-client.js";

export const analysisRoutes = Router();

const cpfSchema = z
  .string()
  .regex(/^\d{11}$/, "CPF deve conter exatamente 11 dígitos, sem pontos ou traços");

const defaultPfProducts = {
  basic_data: true,
  default_financial: true,
  judicial: true,
  ai: true,
  antifraud: false,
  antifraud_pix: false,
  antifraud_quiz: false,
  banking_history: false,
  advanced_financial: false,
  pre_visit: false,
  pre_visit_judicial: false,
  financial_open_finance: false,
  biometrics_with_liveness: false
};

const createPfAnalysisSchema = z.object({
  cpf: cpfSchema,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  selfie: z.string().optional(),
  products: z.record(z.boolean()).default(defaultPfProducts)
});

const analysisParamsSchema = z.object({
  id: z.string().uuid()
});

analysisRoutes.use(ensureAuthenticated);

analysisRoutes.post("/pf", requireRole(UserRole.REAL_ESTATE), async (request, response) => {
  if (!request.user) {
    throw new AppError(401, "Token ausente");
  }

  const input = createPfAnalysisSchema.parse(request.body);

  const oragoResponse = await oragoClient.createPfAnalysis(input);

  const analysis = await prisma.analysis.create({
    data: {
      cpf: input.cpf,
      products: JSON.stringify(input.products),
      oragoAnalysisId: oragoResponse.analysis_id,
      requesterId: request.user.id
    }
  });

  return response.status(201).json({
    analysis: {
      id: analysis.id,
      oragoAnalysisId: analysis.oragoAnalysisId,
      cpf: analysis.cpf,
      status: analysis.status,
      createdAt: analysis.createdAt
    }
  });
});

analysisRoutes.get("/mine", requireRole(UserRole.REAL_ESTATE), async (request, response) => {
  const analyses = await prisma.analysis.findMany({
    where: { requesterId: request.user?.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      oragoAnalysisId: true,
      cpf: true,
      status: true,
      result: true,
      products: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return response.json({
    analyses: analyses.map((analysis) => ({
      ...analysis,
      products: JSON.parse(analysis.products),
      result: analysis.result ? JSON.parse(analysis.result) : null
    }))
  });
});

analysisRoutes.get("/:id", async (request, response) => {
  const params = analysisParamsSchema.parse(request.params);
  const analysis = await prisma.analysis.findUnique({
    where: { id: params.id },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  });

  if (!analysis) {
    throw new AppError(404, "Análise não encontrada");
  }

  if (request.user?.role !== UserRole.ADMIN && analysis.requesterId !== request.user?.id) {
    throw new AppError(403, "Acesso negado");
  }

  return response.json({
    analysis: {
      ...analysis,
      products: JSON.parse(analysis.products),
      result: analysis.result ? JSON.parse(analysis.result) : null
    }
  });
});

analysisRoutes.post("/:id/collect", requireRole(UserRole.REAL_ESTATE), async (request, response) => {
  const params = analysisParamsSchema.parse(request.params);
  const analysis = await prisma.analysis.findUnique({
    where: { id: params.id }
  });

  if (!analysis) {
    throw new AppError(404, "Análise não encontrada");
  }

  if (analysis.requesterId !== request.user?.id) {
    throw new AppError(403, "Acesso negado");
  }

  const oragoResponse = await oragoClient.collectAnalysis(analysis.oragoAnalysisId);
  const nextStatus = oragoResponse.error
    ? AnalysisStatus.FAILED
    : oragoResponse.ready
      ? AnalysisStatus.READY
      : analysis.status;

  const updatedAnalysis = await prisma.analysis.update({
    where: { id: analysis.id },
    data: {
      status: nextStatus,
      result: oragoResponse.data === undefined ? analysis.result : JSON.stringify(oragoResponse.data)
    }
  });

  return response.json({
    analysis: {
      ...updatedAnalysis,
      products: JSON.parse(updatedAnalysis.products),
      result: updatedAnalysis.result ? JSON.parse(updatedAnalysis.result) : null
    },
    orago: oragoResponse
  });
});
