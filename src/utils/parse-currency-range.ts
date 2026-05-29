import { parseBrazilianCurrency } from "./parse-brazilian-currency.js";
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

  return {
    min: parsedValues[0] ?? null,
    max: parsedValues[1] ?? parsedValues[0] ?? null,
    raw: value,
  };
}