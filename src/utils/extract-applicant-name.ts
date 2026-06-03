export function extractApplicantName(
  documentType: "CPF" | "CNPJ",
  oragoData: any,
): string | null {
  if (!oragoData) return null;

  const rawName =
    documentType === "CPF"
      ? oragoData.identity?.name ??
        oragoData.resume?.name
      : oragoData.company?.name ??
        oragoData.company?.corporateName ??
        oragoData.company?.corporate_name ??
        oragoData.company?.socialName ??
        oragoData.company?.social_name ??
        oragoData.company?.legalName ??
        oragoData.company?.legal_name ??
        oragoData.resume?.name;

  if (typeof rawName !== "string") return null;

  const name = rawName.trim();

  return name.length > 0 ? name : null;
}