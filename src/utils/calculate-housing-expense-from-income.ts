import { HousingExpenseRange } from "../schemas/consults.schemas.js";
import { parseCurrencyRange } from "./parse-currency-range.js";

export function calculateHousingExpenseFromIncome(
  presumedIncome?: string | null,
): HousingExpenseRange {
  const incomeRange = parseCurrencyRange(presumedIncome);

  return {
    min: incomeRange.min ? incomeRange.min * 0.3 : null,
    max: incomeRange.max ? incomeRange.max * 0.3 : null,
    raw: presumedIncome ?? null,
  };
}