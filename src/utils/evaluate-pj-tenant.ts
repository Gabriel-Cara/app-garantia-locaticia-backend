import {
  TenantDecisionInput,
  TenantDecisionResult,
} from "../schemas/consults.schemas.js";
import { calculatePjHousingExpense } from "./calculate-pj-housing-expense.js";
import { extractOragoDecision } from "./extract-orago-decision.js";
import { parseNumber } from "./parse-number.js";
import { parsePercentage } from "./parse-percentage.js";

export function evaluatePjTenant(
  oragoData: any,
  input: TenantDecisionInput,
): TenantDecisionResult {
  const company = oragoData?.company;
  const financial = oragoData?.financial;

  const requestedExpense =
    input.rentValue + input.condominiumValue + input.feesValue;

  const oragoDecision = extractOragoDecision(oragoData);

  const creditScore =
    parseNumber(financial?.riskScore) ??
    parseNumber(financial?.score) ??
    parseNumber(company?.score);

  const defaultProbability = parsePercentage(financial?.default_prob);

  const financialRiskLevel = parseNumber(financial?.riskLevel);
  const companyRiskLevel = parseNumber(company?.riskLevel);

  const housingExpense = calculatePjHousingExpense({
    presumedRevenueAmount: financial?.presumedRevenueAmount,
    incomeRange: financial?.incomeRange,
    riskLevel: financialRiskLevel ?? companyRiskLevel,
    creditScore,
    defaultProbability,
  });

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
        creditScore,
        defaultProbability,
        financialRiskLevel,
        companyRiskLevel,
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
        creditScore,
        defaultProbability,
        financialRiskLevel,
        companyRiskLevel,
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
        "A Órago recomendou a análise, mas não foi possível calcular a capacidade máxima de despesa com imóvel para PJ.",
      ],
      metadata: {
        decisionSource: "DOCULOC_HOUSING_RULE",
        oragoDecision,
        doculocRuleApplied: true,
        creditScore,
        defaultProbability,
        financialRiskLevel,
        companyRiskLevel,
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
        )} está acima do limite máximo estimado de R$ ${housingExpense.max.toFixed(
          2,
        )} para a empresa.`,
      ],
      metadata: {
        decisionSource: "DOCULOC_HOUSING_RULE",
        oragoDecision,
        doculocRuleApplied: true,
        requestedExpense,
        housingExpenseMax: housingExpense.max,
        creditScore,
        defaultProbability,
        financialRiskLevel,
        companyRiskLevel,
      },
    };
  }

  return {
    status: "approved",
    recommendation: "recommended",
    requestedExpense,
    housingExpense,
    reasons: [
      "A Órago recomendou a análise e a despesa informada está dentro da capacidade estimada pela regra Doculoc.",
    ],
    metadata: {
      decisionSource: "ORAGO_AND_DOCULOC_HOUSING_RULE",
      oragoDecision,
      doculocRuleApplied: true,
      requestedExpense,
      housingExpenseMax: housingExpense.max,
      creditScore,
      defaultProbability,
      financialRiskLevel,
      companyRiskLevel,
    },
  };
}