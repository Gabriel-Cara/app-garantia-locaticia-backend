// Libs
import { prisma } from "../lib/prisma.js";

// Errors
import { AppError } from "../middlewares/error-handler.js";

// Services
import { CreditService } from "./credit.service.js";
import { oragoClient } from "./orago-client.js";

// Utils
import { evaluateTenant } from "../utils/evaluate-tenant.js";

const creditService = new CreditService();

type CreateByCpfInput = {
  requesterId: string;
  cpf: string;
  email?: string;
  phone?: string;
  selfie?: string;
  rentValue: number;
  condominiumValue: number;
  feesValue: number;
};

type CreateByCnpjInput = {
  requesterId: string;
  cnpj: string;
  rentValue: number;
  condominiumValue: number;
  feesValue: number;
};

function mapDecisionStatus(status: string) {
  if (status === "approved") return "APPROVED";
  if (status === "rejected") return "REJECTED";
  return "MANUAL_REVIEW";
}

function mapRecommendationStatus(status: string) {
  if (status === "recommended") return "RECOMMENDED";
  if (status === "not_recommended") return "NOT_RECOMMENDED";
  return "UNKNOWN";
}

function getInitialWorkflowStatus(decisionStatus: string) {
  if (decisionStatus === "APPROVED") return "WAITING_CONTRACT_DATA";
  if (decisionStatus === "REJECTED") return "REJECTED";
  return "CONSULTED";
}

export class RentalApplicationService {
  private async createApplicationAndConsumeCredit(params: {
    requesterId: string;
    data: Parameters<typeof prisma.rentalApplication.create>[0]["data"];
  }) {
    return prisma.$transaction(async (tx) => {
      const wallet = await tx.userCreditWallet.findUnique({
        where: { userId: params.requesterId },
      });

      if (!wallet) {
        throw new AppError(403, "Carteira de créditos não encontrada");
      }

      if (!wallet.isVip && wallet.availableCredits <= 0) {
        throw new AppError(402, "Usuário sem consultas disponíveis");
      }

      const createdApplication = await tx.rentalApplication.create({
        data: params.data,
      });

      if (wallet.isVip) {
        await tx.creditLedger.create({
          data: {
            userId: params.requesterId,
            type: "CONSULT_USED",
            amount: 0,
            balanceAfter: wallet.availableCredits,
            reason: `Consulta realizada como VIP. Application: ${createdApplication.id}`,
          },
        });

        return createdApplication;
      }

      const updatedWallet = await tx.userCreditWallet.update({
        where: { userId: params.requesterId },
        data: {
          availableCredits: {
            decrement: 1,
          },
        },
      });

      await tx.creditLedger.create({
        data: {
          userId: params.requesterId,
          type: "CONSULT_USED",
          amount: -1,
          balanceAfter: updatedWallet.availableCredits,
          reason: `Crédito consumido na consulta. Application: ${createdApplication.id}`,
        },
      });

      return createdApplication;
    });
  }

  async createByCpf(input: CreateByCpfInput) {
    await creditService.ensureCanConsult(input.requesterId);

    const oragoCreateResponse = await oragoClient.createPfAnalysis({
      cpf: input.cpf,
      email: input.email,
      phone: input.phone,
      selfie: input.selfie,
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

    const collectResponse = await oragoClient.collectAnalysis(
      oragoCreateResponse.analysis_id,
    );

    if (!collectResponse || collectResponse.error || !collectResponse.ready) {
      throw new AppError(502, "Erro ao coletar resultado da análise na Órago");
    }

    const decision = evaluateTenant({
      documentType: "CPF",
      oragoData: collectResponse.data,
      input: {
        rentValue: input.rentValue,
        condominiumValue: input.condominiumValue,
        feesValue: input.feesValue,
      },
    });

    const automaticDecision = mapDecisionStatus(decision.status);
    const recommendation = mapRecommendationStatus(decision.recommendation);
    const workflowStatus = getInitialWorkflowStatus(automaticDecision);

    const application = await this.createApplicationAndConsumeCredit({
      requesterId: input.requesterId,
      data: {
        documentType: "CPF",
        document: input.cpf,
        requesterId: input.requesterId,

        oragoAnalysisId: oragoCreateResponse.analysis_id,
        oragoRawResponse: JSON.stringify(collectResponse),
        oragoData: JSON.stringify(collectResponse.data),

        rentValue: input.rentValue,
        condominiumValue: input.condominiumValue,
        feesValue: input.feesValue,
        requestedExpense: decision.requestedExpense,

        automaticDecision,
        recommendation,

        housingExpenseMin: decision.housingExpense.min,
        housingExpenseMax: decision.housingExpense.max,

        decisionReasons: JSON.stringify(decision.reasons),
        decisionMetadata: decision.metadata
          ? JSON.stringify(decision.metadata)
          : null,

        status: workflowStatus,
      },
    });

    return {
      application,
      decision,
    };
  }

  async createByCnpj(input: CreateByCnpjInput) {
    await creditService.ensureCanConsult(input.requesterId);

    const oragoCreateResponse = await oragoClient.createPjAnalysis({
      cnpj: input.cnpj,
      products: {
        company_analysis_judicial: true,
        company_analysis_financial: true,
        ai: true,
      },
    });

    const collectResponse = await oragoClient.collectAnalysis(
      oragoCreateResponse.analysis_id,
    );

    if (!collectResponse || collectResponse.error || !collectResponse.ready) {
      throw new AppError(502, "Erro ao coletar resultado da análise na Órago");
    }

    const decision = evaluateTenant({
      documentType: "CNPJ",
      oragoData: collectResponse.data,
      input: {
        rentValue: input.rentValue,
        condominiumValue: input.condominiumValue,
        feesValue: input.feesValue,
      },
    });

    const automaticDecision = mapDecisionStatus(decision.status);
    const recommendation = mapRecommendationStatus(decision.recommendation);
    const workflowStatus = getInitialWorkflowStatus(automaticDecision);

    const application = await prisma.$transaction(async (tx) => {
      const wallet = await tx.userCreditWallet.findUnique({
        where: { userId: input.requesterId },
      });

      if (!wallet) {
        throw new AppError(403, "Carteira de créditos não encontrada");
      }

      if (!wallet.isVip && wallet.availableCredits <= 0) {
        throw new AppError(402, "Usuário sem consultas disponíveis");
      }

      const createdApplication = await tx.rentalApplication.create({
        data: {
          documentType: "CNPJ",
          document: input.cnpj,
          requesterId: input.requesterId,

          oragoAnalysisId: oragoCreateResponse.analysis_id,
          oragoRawResponse: JSON.stringify(collectResponse),
          oragoData: JSON.stringify(collectResponse.data),

          rentValue: input.rentValue,
          condominiumValue: input.condominiumValue,
          feesValue: input.feesValue,
          requestedExpense: decision.requestedExpense,

          automaticDecision,
          recommendation,

          housingExpenseMin: decision.housingExpense.min,
          housingExpenseMax: decision.housingExpense.max,

          decisionReasons: JSON.stringify(decision.reasons),
          decisionMetadata: decision.metadata
            ? JSON.stringify(decision.metadata)
            : null,
          status: workflowStatus,
        },
      });

      if (wallet.isVip) {
        await tx.creditLedger.create({
          data: {
            userId: input.requesterId,
            type: "CONSULT_USED",
            amount: 0,
            balanceAfter: wallet.availableCredits,
            reason: `Consulta realizada como VIP. Application: ${createdApplication.id}`,
          },
        });
      } else {
        const updatedWallet = await tx.userCreditWallet.update({
          where: { userId: input.requesterId },
          data: {
            availableCredits: {
              decrement: 1,
            },
          },
        });

        await tx.creditLedger.create({
          data: {
            userId: input.requesterId,
            type: "CONSULT_USED",
            amount: -1,
            balanceAfter: updatedWallet.availableCredits,
            reason: `Crédito consumido na consulta. Application: ${createdApplication.id}`,
          },
        });
      }

      return createdApplication;
    });

    return {
      application,
      decision,
    };
  }

  async fillContractData(params: {
    applicationId: string;
    requesterId: string;
    data: {
      tenantName: string;
      tenantDocument: string;
      tenantEmail: string;
      tenantPhone: string;
      propertyZipCode: string;
      propertyStreet: string;
      propertyNumber: string;
      propertyComplement?: string;
      propertyNeighborhood: string;
      propertyCity: string;
      propertyState: string;
    };
  }) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: params.applicationId },
    });

    if (!application) {
      throw new AppError(404, "Consulta não encontrada");
    }

    if (application.requesterId !== params.requesterId) {
      throw new AppError(403, "Acesso negado");
    }

    const canFillContractData = application.status === "WAITING_CONTRACT_DATA";

    if (!canFillContractData) {
      throw new AppError(
        400,
        "Essa consulta ainda não está liberada para preenchimento dos dados do contrato",
      );
    }

    const updatedApplication = await prisma.rentalApplication.update({
      where: { id: params.applicationId },
      data: {
        ...params.data,
        status: "WAITING_ADMIN_CONTRACT",
      },
    });

    await prisma.contract.upsert({
      where: {
        applicationId: params.applicationId,
      },
      create: {
        applicationId: params.applicationId,
        status: "PENDING",
        templateName: "default-rental-contract.docx",
      },
      update: {
        status: "PENDING",
      },
    });

    return updatedApplication;
  }

  async contest(params: {
    applicationId: string;
    requesterId: string;
    reason: string;
  }) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: params.applicationId },
    });

    if (!application) {
      throw new AppError(404, "Consulta não encontrada");
    }

    if (application.requesterId !== params.requesterId) {
      throw new AppError(403, "Acesso negado");
    }

    if (application.status !== "REJECTED") {
      throw new AppError(
        400,
        "Somente consultas rejeitadas podem ser contestadas",
      );
    }

    const openContest = await prisma.rentalApplicationContest.findFirst({
      where: {
        applicationId: params.applicationId,
        status: "OPEN",
      },
    });

    if (openContest) {
      throw new AppError(
        409,
        "Já existe uma contestação aberta para esta consulta",
      );
    }

    const contest = await prisma.$transaction(async (tx) => {
      const createdContest = await tx.rentalApplicationContest.create({
        data: {
          applicationId: params.applicationId,
          createdById: params.requesterId,
          reason: params.reason,
        },
      });

      await tx.rentalApplication.update({
        where: {
          id: params.applicationId,
        },
        data: {
          status: "CONTESTED",
        },
      });

      return createdContest;
    });

    return contest;
  }

  async adminDecide(params: {
    applicationId: string;
    adminId: string;
    decision: "APPROVED" | "REJECTED";
    reason?: string;
  }) {
    const application = await prisma.rentalApplication.findUnique({
      where: { id: params.applicationId },
    });

    if (!application) {
      throw new AppError(404, "Consulta não encontrada");
    }

    const nextStatus =
      params.decision === "APPROVED"
        ? "WAITING_CONTRACT_DATA"
        : "ADMIN_REJECTED";

    const updatedApplication = await prisma.$transaction(async (tx) => {
      const updated = await tx.rentalApplication.update({
        where: {
          id: params.applicationId,
        },
        data: {
          adminDecision: params.decision,
          adminDecisionById: params.adminId,
          adminDecisionAt: new Date(),
          adminDecisionReason: params.reason,
          status: nextStatus,
        },
      });

      await tx.rentalApplicationContest.updateMany({
        where: {
          applicationId: params.applicationId,
          status: "OPEN",
        },
        data: {
          status: params.decision === "APPROVED" ? "ACCEPTED" : "REJECTED",
          reviewedById: params.adminId,
          reviewedAt: new Date(),
          adminNote: params.reason,
        },
      });

      return updated;
    });

    return updatedApplication;
  }
}
