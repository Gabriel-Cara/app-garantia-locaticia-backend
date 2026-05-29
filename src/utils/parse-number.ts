export function parseNumber(value?: string | number | null): number | null {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const normalized = value
    .replace(/[^\d,.-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : null;
}