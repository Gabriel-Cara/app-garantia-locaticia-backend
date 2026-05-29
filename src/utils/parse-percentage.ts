export function parsePercentage(value?: string | number | null): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return value;
  }

  const normalized = value
    .replace("%", "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}