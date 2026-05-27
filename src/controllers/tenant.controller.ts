import { Request, Response } from "express";
import { oragoClient } from "../services/orago-client.js";
import { evaluateTenant } from "../services/evaluate-tenant.js";
import { consultAnalysisSchema } from "../schemas/analysis.schemas.js";

class TenantController {
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

    if (!oragoResponse) {
      return response
        .status(502)
        .json({ error: "Erro na consulta de análise na Órago" });
    }

    const collectResponse = await oragoClient.collectAnalysis(
      oragoResponse.analysis_id,
    );

    if (!collectResponse || collectResponse.error || !collectResponse.ready) {
      return response
        .status(502)
        .json({ error: "Erro ao coletar resultado da análise na Órago" });
    }

    const decision = evaluateTenant(collectResponse.data, {
      rentValue: rentValue,
      condominiumValue: condominiumValue,
      feesValue: feesValue,
    });

    return response.status(200).json(decision);
  }
}

export { TenantController };