import {
  TenantDecisionInput,
  TenantDecisionResult,
} from "../schemas/consults.schemas.js";
import { calculatePjHousingExpense } from "./calculate-pj-housing-expense.js";
import { parseNumber } from "./parse-number.js";
import { parsePercentage } from "./parse-percentage.js";

function isCompanyActive(status?: string | null) {
  return status?.trim().toUpperCase() === "ATIVA";
}

function getArrayCount(value: unknown): number {
  return Array.isArray(value) ? value.length : 0;
}

function getSummaryCount(summary: any): number {
  const count = Number(summary?.count ?? 0);
  return Number.isFinite(count) ? count : 0;
}

function getSummaryBalance(summary: any): number {
  const balance = Number(summary?.balance ?? 0);
  return Number.isFinite(balance) ? balance : 0;
}

function hasRelevantDebts(financial: any) {
  const debtsCount = getArrayCount(financial?.debts);
  const summaryCount = getSummaryCount(financial?.debts_summary);
  const summaryBalance = getSummaryBalance(financial?.debts_summary);

  return debtsCount > 0 || summaryCount > 0 || summaryBalance > 0;
}

function hasRelevantProtests(financial: any) {
  const protestsCount = getArrayCount(financial?.protests);
  const summaryCount = getSummaryCount(financial?.protests_summary);
  const summaryBalance = getSummaryBalance(financial?.protests_summary);

  return protestsCount > 0 || summaryCount > 0 || summaryBalance > 0;
}

function hasNegatives(financial: any) {
  return getArrayCount(financial?.negative) > 0;
}

function hasRecentOrAlertableJudicialRisk(judicial: any) {
  return (
    judicial?.hasAlertableLawSuits === true ||
    judicial?.hasRecentEviction === true ||
    judicial?.hasCriminalLawSuits === true
  );
}

function hasHighJudicialRisk(judicial: any) {
  const riskLevel = Number(judicial?.riskLevel ?? 0);
  const totalPassive = Number(judicial?.totalPassive ?? 0);

  return riskLevel >= 3 || totalPassive >= 5;
}

export function evaluatePjTenant(
  oragoData: any,
  input: TenantDecisionInput,
): TenantDecisionResult {
  const company = oragoData.company;
  const financial = oragoData.financial;
  const judicial = oragoData.judicial;

  const requestedExpense =
    input.rentValue + input.condominiumValue + input.feesValue;

  const reasons: string[] = [];
  const warnings: string[] = [];

  const companyStatus = company?.status ?? null;

  const creditScore =
    parseNumber(financial?.riskScore) ??
    parseNumber(financial?.score) ??
    parseNumber(company?.score);

  const defaultProbability = parsePercentage(financial?.default_prob);

  const financialRiskLevel = parseNumber(financial?.riskLevel);
  const judicialRiskLevel = parseNumber(judicial?.riskLevel);
  const companyRiskLevel = parseNumber(company?.riskLevel);

  const housingExpense = calculatePjHousingExpense({
    presumedRevenueAmount: financial?.presumedRevenueAmount,
    incomeRange: financial?.incomeRange,
    riskLevel: financialRiskLevel ?? companyRiskLevel,
    creditScore,
    defaultProbability,
  });

  if (!isCompanyActive(companyStatus)) {
    reasons.push(
      `Empresa com status cadastral diferente de ATIVA: ${companyStatus ?? "não informado"}`,
    );
  }

  if (creditScore === null) {
    warnings.push("Score de crédito PJ não informado");
  } else if (creditScore < 300) {
    reasons.push(`Score de crédito PJ muito baixo: ${creditScore}`);
  } else if (creditScore < 400) {
    warnings.push(`Score de crédito PJ em faixa de atenção: ${creditScore}`);
  }

  if (defaultProbability === null) {
    warnings.push("Probabilidade de inadimplência PJ não informada");
  } else if (defaultProbability > 30) {
    reasons.push(
      `Probabilidade de inadimplência muito alta: ${defaultProbability}%`,
    );
  } else if (defaultProbability > 20) {
    warnings.push(
      `Probabilidade de inadimplência em faixa de atenção: ${defaultProbability}%`,
    );
  }

  if (hasNegatives(financial)) {
    reasons.push("Empresa possui negativações");
  }

  if (hasRelevantDebts(financial)) {
    reasons.push("Empresa possui dívidas registradas");
  }

  if (hasRelevantProtests(financial)) {
    reasons.push("Empresa possui protestos registrados");
  }

  if (hasRecentOrAlertableJudicialRisk(judicial)) {
    reasons.push(
      "Empresa possui risco judicial alertável ou ocorrência judicial recente relevante",
    );
  }

  if (hasHighJudicialRisk(judicial)) {
    warnings.push(
      `Empresa possui volume ou nível de risco judicial em atenção. Passivos: ${judicial?.totalPassive ?? 0}, risco judicial: ${judicialRiskLevel ?? "não informado"}`,
    );
  }

  if (!housingExpense.max) {
    warnings.push(
      "Não foi possível calcular capacidade máxima de despesa com imóvel para PJ",
    );
  } else if (requestedExpense > housingExpense.max * 1.2) {
    reasons.push(
      `Despesa informada de R$ ${requestedExpense.toFixed(
        2,
      )} excede em mais de 20% o limite estimado de R$ ${housingExpense.max.toFixed(2)} para a empresa`,
    );
  } else if (requestedExpense > housingExpense.max) {
    warnings.push(
      `Despesa informada de R$ ${requestedExpense.toFixed(
        2,
      )} está acima do limite estimado de R$ ${housingExpense.max.toFixed(2)} e requer análise manual`,
    );
  }

  if (reasons.length > 0) {
    return {
      status: "rejected",
      recommendation: "not_recommended",
      requestedExpense,
      housingExpense,
      reasons,
      metadata: {
        companyStatus,
        creditScore,
        defaultProbability,
        financialRiskLevel,
        judicialRiskLevel,
        companyRiskLevel,
        warnings,
      },
    };
  }

  if (warnings.length > 0) {
    return {
      status: "manual_review",
      recommendation: "unknown",
      requestedExpense,
      housingExpense,
      reasons: warnings,
      metadata: {
        companyStatus,
        creditScore,
        defaultProbability,
        financialRiskLevel,
        judicialRiskLevel,
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
      "Empresa ativa, sem negativações, sem dívidas/protestos relevantes, risco de inadimplência aceitável e despesa dentro da capacidade estimada",
    ],
    metadata: {
      companyStatus,
      creditScore,
      defaultProbability,
      financialRiskLevel,
      judicialRiskLevel,
      companyRiskLevel,
    },
  };
}
