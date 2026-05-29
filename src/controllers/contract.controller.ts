// Libs
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { z } from "zod";

// Services
import { ContractService } from "../services/contract.service.js";

// Errors
import { AppError } from "../middlewares/error-handler.js";

const contractService = new ContractService();

const applicationParamsSchema = z.object({
  applicationId: z.string().uuid(),
});

const contractParamsSchema = z.object({
  id: z.string().uuid(),
});

export class ContractController {
  async generate(request: Request, response: Response) {
    const params = applicationParamsSchema.parse(request.params);

    const contract = await contractService.generateContract({
      applicationId: params.applicationId,
      adminId: request.user!.id,
    });

    return response.status(201).json({ contract });
  }

  async download(request: Request, response: Response) {
    const params = contractParamsSchema.parse(request.params);

    const contract = await prisma.contract.findUnique({
      where: {
        id: params.id,
      },
      include: {
        application: true,
      },
    });

    if (!contract || !contract.filePath) {
      throw new AppError(404, "Contrato não encontrado");
    }

    const isAdmin = request.user!.role === "ADMIN";
    const isOwner = contract.application.requesterId === request.user!.id;

    if (!isAdmin && !isOwner) {
      throw new AppError(403, "Acesso negado");
    }

    return response.download(contract.filePath, contract.fileName ?? "contrato.docx");
  }
}