// Utils
import { parseBrazilianCurrency } from "./parse-brazilian-currency.js";

// Schemas
import { HousingExpenseRange } from "../schemas/consults.schemas.js";

export function parseCurrencyRange(value?: string | null): HousingExpenseRange {
  if (!value) {
    return {
      min: null,
      max: null,
      raw: null,
    };
  }

  const matches = value.match(/R\$\s?[\d.]+,\d{2}/g);

  if (!matches || matches.length === 0) {
    return {
      min: null,
      max: null,
      raw: value,
    };
  }

  const parsedValues = matches.map(parseBrazilianCurrency);

  const [ min, max ] = parsedValues;

  const minExpense = min * 0.3;
  const maxExpense = max * 0.3;

  parsedValues[0] = minExpense;
  parsedValues[1] = maxExpense;

  return {
    min: parsedValues[0] ?? null,
    max: parsedValues[1] ?? parsedValues[0] ?? null,
    raw: value,
  };
}