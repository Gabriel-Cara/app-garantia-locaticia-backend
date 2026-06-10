import {
  TenantDecisionInput,
  TenantDecisionResult,
} from "../schemas/consults.schemas.js";
import { calculateHousingExpenseFromIncome } from "./calculate-housing-expense-from-income.js";
import { extractOragoDecision } from "./extract-orago-decision.js";

export function evaluatePfTenant(
  oragoData: any,
  input: TenantDecisionInput,
): TenantDecisionResult {
  const requestedExpense =
    input.rentValue + input.condominiumValue + input.feesValue;

  const housingExpense = calculateHousingExpenseFromIncome(
    oragoData?.financial?.presumed_income ?? null,
  );

  const oragoDecision = extractOragoDecision(oragoData);

  if (oragoDecision.status === "not_recommended") {
    return {
      status: "rejected",
      recommendation: "not_recommended",
      requestedExpense,
      housingExpense,
      reasons: ["A análise oficial da Órago retornou como não recomendada."],
      metadata: {
        decisionSource: "ORAGO",
        oragoDecision,
        doculocRuleApplied: false,
      },
    };
  }

  if (oragoDecision.status === "unknown") {
    return {
      status: "manual_review",
      recommendation: "unknown",
      requestedExpense,
      housingExpense,
      reasons: [
        "Não foi possível identificar com segurança a recomendação oficial da Órago.",
      ],
      metadata: {
        decisionSource: "ORAGO_UNKNOWN",
        oragoDecision,
        doculocRuleApplied: false,
      },
    };
  }

  if (!housingExpense.max) {
    return {
      status: "manual_review",
      recommendation: "recommended",
      requestedExpense,
      housingExpense,
      reasons: [
        "A Órago recomendou a análise, mas não foi possível identificar a despesa máxima com moradia.",
      ],
      metadata: {
        decisionSource: "DOCULOC_HOUSING_RULE",
        oragoDecision,
        doculocRuleApplied: true,
      },
    };
  }

  if (requestedExpense > housingExpense.max) {
    return {
      status: "rejected",
      recommendation: "recommended",
      requestedExpense,
      housingExpense,
      reasons: [
        `A Órago recomendou a análise, porém a despesa informada de R$ ${requestedExpense.toFixed(
          2,
        )} está acima do limite máximo de moradia de R$ ${housingExpense.max.toFixed(
          2,
        )}.`,
      ],
      metadata: {
        decisionSource: "DOCULOC_HOUSING_RULE",
        oragoDecision,
        doculocRuleApplied: true,
        requestedExpense,
        housingExpenseMax: housingExpense.max,
      },
    };
  }

  return {
    status: "approved",
    recommendation: "recommended",
    requestedExpense,
    housingExpense,
    reasons: [
      "A Órago recomendou a análise e a despesa informada está dentro do limite permitido pela regra Doculoc.",
    ],
    metadata: {
      decisionSource: "ORAGO_AND_DOCULOC_HOUSING_RULE",
      oragoDecision,
      doculocRuleApplied: true,
      requestedExpense,
      housingExpenseMax: housingExpense.max,
    },
  };
}