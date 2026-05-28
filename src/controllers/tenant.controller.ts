import { Request, Response } from "express";
import { oragoClient } from "../services/orago-client.js";
import { evaluateTenant } from "../utils/evaluate-tenant.js";
import {
  consultByCpfAnalysisSchema,
  consultByCnpjAnalysisSchema,
} from "../schemas/analysis.schemas.js";

class TenantController {
  async consultByCpf(request: Request, response: Response) {
    const { cpf, rentValue, condominiumValue, feesValue, ...rest } =
      consultByCpfAnalysisSchema.parse(request.body);

    const oragoResponse = await oragoClient.createPfAnalysis({
      cpf,
      ...rest,
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

  async consultByCnpj(request: Request, response: Response) {
    const { cnpj, rentValue, condominiumValue, feesValue, ...rest } =
      consultByCnpjAnalysisSchema.parse(request.body);

    const oragoResponse = await oragoClient.createPjAnalysis({
      cnpj,
      ...rest,
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
