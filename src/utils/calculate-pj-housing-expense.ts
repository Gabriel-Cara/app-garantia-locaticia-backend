import { HousingExpenseRange } from "../schemas/consults.schemas.js";
import { parseCurrencyRange } from "./parse-currency-range.js";
import { parseNumber } from "./parse-number.js";

type CalculatePjHousingExpenseParams = {
  presumedRevenueAmount?: string | number | null;
  incomeRange?: string | null;
  riskLevel?: number | null;
  creditScore?: number | null;
  defaultProbability?: number | null;
};

function getPjHousingPercentage(params: {
  riskLevel?: number | null;
  creditScore?: number | null;
  defaultProbability?: number | null;
}) {
  const { riskLevel, creditScore, defaultProbability } = params;

  if (
    creditScore !== null &&
    creditScore !== undefined &&
    creditScore >= 700 &&
    defaultProbability !== null &&
    defaultProbability !== undefined &&
    defaultProbability <= 10 &&
    riskLevel !== null &&
    riskLevel !== undefined &&
    riskLevel <= 1
  ) {
    return 0.2;
  }

  if (
    creditScore !== null &&
    creditScore !== undefined &&
    creditScore >= 400 &&
    defaultProbability !== null &&
    defaultProbability !== undefined &&
    defaultProbability <= 20
  ) {
    return 0.15;
  }

  return 0.1;
}

export function calculatePjHousingExpense(
  params: CalculatePjHousingExpenseParams,
): HousingExpenseRange {
  const presumedAnnualRevenue = parseNumber(params.presumedRevenueAmount);

  const percentage = getPjHousingPercentage({
    riskLevel: params.riskLevel,
    creditScore: params.creditScore,
    defaultProbability: params.defaultProbability,
  });

  if (presumedAnnualRevenue) {
    const presumedMonthlyRevenue = presumedAnnualRevenue / 12;
    const max = presumedMonthlyRevenue * percentage;

    return {
      min: presumedMonthlyRevenue * 0.1,
      max,
      raw: `Faturamento presumido anual: ${presumedAnnualRevenue}. Percentual aplicado: ${percentage * 100}%`,
    };
  }

  const incomeRange = parseCurrencyRange(params.incomeRange);

  if (incomeRange.min && incomeRange.max) {
    const monthlyMin = incomeRange.min / 12;
    const monthlyMax = incomeRange.max / 12;

    return {
      min: monthlyMin * 0.1,
      max: monthlyMax * percentage,
      raw: params.incomeRange ?? null,
    };
  }

  return {
    min: null,
    max: null,
    raw: params.incomeRange ?? null,
  };
}