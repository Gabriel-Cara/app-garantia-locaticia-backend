// Libs
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// Schemas
import {
  analysisParamsSchema,
  consultAnalysisSchema,
  createPfAnalysisSchema,
  listAnalysesSchema,
} from "../schemas/analysis.schemas.js";

// Utils
import { AppError } from "../middlewares/error-handler.js";
import { oragoClient } from "../services/orago-client.js";

// Types
import { AnalysisStatus, UserRole } from "../domain/roles.js";

class AnalysisController {
  async create(request: Request, response: Response) {
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
        requesterId: request.user.id,
      },
    });

    return response.status(201).json({
      analysis: {
        id: analysis.id,
        oragoAnalysisId: analysis.oragoAnalysisId,
        cpf: analysis.cpf,
        status: analysis.status,
        createdAt: analysis.createdAt,
      },
    });
  }

  async listMine(request: Request, response: Response) {
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
        updatedAt: true,
      },
    });

    return response.json({ analyses });
  }

  async getById(request: Request, response: Response) {
    const params = analysisParamsSchema.parse(request.params);

    const analysis = await prisma.analysis.findUnique({
      where: { id: params.id },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!analysis) {
      throw new AppError(404, "Análise não encontrada");
    }

    if (
      request.user?.role !== UserRole.ADMIN &&
      analysis.requesterId !== request.user?.id
    ) {
      throw new AppError(403, "Acesso negado");
    }

    return response.json({
      analysis: {
        ...analysis,
        products: JSON.parse(analysis.products),
        result: analysis.result ? JSON.parse(analysis.result) : null,
      },
    });
  }

  async collect(request: Request, response: Response) {
    const params = analysisParamsSchema.parse(request.params);

    const analysis = await prisma.analysis.findUnique({
      where: { id: params.id },
    });

    if (!analysis) {
      throw new AppError(404, "Análise não encontrada");
    }

    if (analysis.requesterId !== request.user?.id) {
      throw new AppError(403, "Acesso negado");
    }

    const oragoResponse = await oragoClient.collectAnalysis(
      analysis.oragoAnalysisId,
    );

    console.log("Orago response:", oragoResponse);

    const nextStatus = oragoResponse.error
      ? AnalysisStatus.FAILED
      : oragoResponse.ready
        ? AnalysisStatus.READY
        : analysis.status;

    const updatedAnalysis = await prisma.analysis.update({
      where: { id: analysis.id },
      data: {
        status: nextStatus,
        result:
          oragoResponse.data === undefined
            ? analysis.result
            : JSON.stringify(oragoResponse.data),
      },
    });

    return response.json({
      analysis: {
        ...updatedAnalysis,
        products: JSON.parse(updatedAnalysis.products),
        result: updatedAnalysis.result
          ? JSON.parse(updatedAnalysis.result)
          : null,
      },
      orago: oragoResponse,
    });
  }

  async list(request: Request, response: Response) {
    const query = listAnalysesSchema.parse(request.query);

    const where = {
      cpf: query.cpf,
      requesterId: query.requesterId,
    };

    const [analyses, total] = await Promise.all([
      prisma.analysis.findMany({
        where,
        skip: (query.page - 1) * query.perPage,
        take: query.perPage,
        orderBy: { createdAt: "desc" },
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.analysis.count({ where }),
    ]);

    return response.json({
      analyses: analyses.map((analysis) => ({
        ...analysis,
        products: JSON.parse(analysis.products),
        result: analysis.result ? JSON.parse(analysis.result) : null,
      })),
      meta: {
        page: query.page,
        perPage: query.perPage,
        total,
        lastPage: Math.ceil(total / query.perPage),
      },
    });
  }

  async consult(request: Request, response: Response) {
    const { cpf, rentValue, condominiumValue, feesValue } =
      consultAnalysisSchema.parse(request.body);

    const oragoResponse = await oragoClient.createPfAnalysis({
      cpf,
      products: {
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
        biometrics_with_liveness: false,
      },
    });

    if(!oragoResponse) {
      return response.status(502).json({ error: "Erro na consulta de análise na Órago" });
    }

    const collectResponse = await oragoClient.collectAnalysis(oragoResponse.analysis_id);

    if(!collectResponse || collectResponse.error || !collectResponse.ready) {
      return response.status(502).json({ error: "Erro ao coletar resultado da análise na Órago" });
    }

    
  }
}

export { AnalysisController };
