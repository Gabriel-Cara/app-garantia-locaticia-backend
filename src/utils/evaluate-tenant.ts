import {
  TenantDecisionInput,
  TenantDecisionResult,
} from "../schemas/consults.schemas.js";
import { evaluatePfTenant } from "./evaluate-pf-tenant.js";
import { evaluatePjTenant } from "./evaluate-pj-tenant.js";

type EvaluateTenantParams = {
  documentType: "CPF" | "CNPJ";
  oragoData: any;
  input: TenantDecisionInput;
};

export function evaluateTenant(params: EvaluateTenantParams): TenantDecisionResult {
  if (params.documentType === "CPF") {
    return evaluatePfTenant(params.oragoData, params.input);
  }

  if (params.documentType === "CNPJ") {
    return evaluatePjTenant(params.oragoData, params.input);
  }

  return {
    status: "manual_review",
    recommendation: "unknown",
    requestedExpense:
      params.input.rentValue +
      params.input.condominiumValue +
      params.input.feesValue,
    housingExpense: {
      min: null,
      max: null,
      raw: null,
    },
    reasons: ["Tipo de documento não suportado para análise automática"],
  };
}