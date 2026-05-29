import {
  TenantDecisionInput,
  TenantDecisionResult,
} from "../schemas/consults.schemas.js";
import { getRecommendationFromStructuredData } from "./get-recommendation-from-structured-data.js";
import { calculateHousingExpenseFromIncome } from "./calculate-housing-expense-from-income.js";

export function evaluatePfTenant(
  oragoData: any,
  input: TenantDecisionInput,
): TenantDecisionResult {
  const requestedExpense =
    input.rentValue + input.condominiumValue + input.feesValue;

  const housingExpense = calculateHousingExpenseFromIncome(
    oragoData.financial?.presumed_income ?? null,
  );

  const recommendationResult = getRecommendationFromStructuredData(oragoData);
  const reasons = [...recommendationResult.reasons];

  if (recommendationResult.recommendation === "not_recommended") {
    return {
      status: "rejected",
      recommendation: "not_recommended",
      requestedExpense,
      housingExpense,
      reasons,
    };
  }

  if (!housingExpense.max) {
    return {
      status: "manual_review",
      recommendation: recommendationResult.recommendation,
      requestedExpense,
      housingExpense,
      reasons: [
        ...reasons,
        "Não foi possível identificar a despesa máxima com moradia",
      ],
    };
  }

  if (requestedExpense > housingExpense.max) {
    return {
      status: "rejected",
      recommendation: "recommended",
      requestedExpense,
      housingExpense,
      reasons: [
        ...reasons,
        `Despesa informada de R$ ${requestedExpense.toFixed(
          2,
        )} está acima do limite máximo de R$ ${housingExpense.max.toFixed(2)}`,
      ],
    };
  }

  return {
    status: "approved",
    recommendation: "recommended",
    requestedExpense,
    housingExpense,
    reasons: ["Análise recomendada e despesa dentro do limite permitido"],
  };
}