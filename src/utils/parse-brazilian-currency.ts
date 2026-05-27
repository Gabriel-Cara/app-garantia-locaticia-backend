export function parseBrazilianCurrency(value: string): number {
  return Number(
    value
      .replace(/[^\d,.-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}