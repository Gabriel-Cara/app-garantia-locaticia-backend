// Libs
import { AppError } from "../middlewares/error-handler.js";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

// Services
import { CreditService } from "../services/credit.service.js";

// Schemas
import {
  setCreditsSchema,
  setVipSchema,
  userIdParamsSchema,
} from "../schemas/credit.schemas.js";

const creditService = new CreditService();

export class CreditController {
  async getWallet(request: Request, response: Response) {
    const params = userIdParamsSchema.parse(request.params);

    const wallet = await prisma.userCreditWallet.findUnique({
      where: {
        userId: params.userId,
      },
    });

    if (!wallet) {
      throw new AppError(404, "Carteira de créditos não encontrada");
    }

    return response.json({ wallet });
  }

  async setCredits(request: Request, response: Response) {
    const params = userIdParamsSchema.parse(request.params);
    const body = setCreditsSchema.parse(request.body);

    const wallet = await creditService.setCredits({
      userId: params.userId,
      actorId: request.user!.id,
      credits: body.credits,
      reason: body.reason,
    });

    return response.json({ wallet });
  }

  async setVip(request: Request, response: Response) {
    const params = userIdParamsSchema.parse(request.params);
    const body = setVipSchema.parse(request.body);

    const wallet = await creditService.setVip({
      userId: params.userId,
      actorId: request.user!.id,
      isVip: body.isVip,
      reason: body.reason,
    });

    return response.json({ wallet });
  }

  async listLedger(request: Request, response: Response) {
    const params = userIdParamsSchema.parse(request.params);

    const ledger = await prisma.creditLedger.findMany({
      where: {
        userId: params.userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return response.json({ ledger });
  }
}