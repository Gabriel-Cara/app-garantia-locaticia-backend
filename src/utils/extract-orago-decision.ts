export type OragoDecisionStatus =
  | "recommended"
  | "not_recommended"
  | "unknown";

export type OragoDecisionSource =
  | "structured_field"
  | "resume_html"
  | "unknown";

export type NormalizedOragoDecision = {
  status: OragoDecisionStatus;
  source: OragoDecisionSource;
  resumeHtml: string | null;
  resumeText: string | null;
};

function stripHtml(value: string) {
  return value
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeText(value: string) {
  return stripHtml(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();
}

function normalizeDecisionValue(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .trim();
}

function getStructuredDecision(oragoData: any): OragoDecisionStatus {
  const candidates = [
    oragoData?.resume?.recommendation,
    oragoData?.resume?.decision,
    oragoData?.resume?.status,
    oragoData?.recommendation,
    oragoData?.decision,
    oragoData?.status_recommendation,
    oragoData?.ai?.recommendation,
    oragoData?.ai?.decision,
  ];

  for (const candidate of candidates) {
    if (typeof candidate !== "string") continue;

    const normalized = normalizeDecisionValue(candidate);

    if (
      normalized === "RECOMMENDED" ||
      normalized === "RECOMENDADO" ||
      normalized === "APROVADO" ||
      normalized === "APPROVED"
    ) {
      return "recommended";
    }

    if (
      normalized === "NOT_RECOMMENDED" ||
      normalized === "NAO_RECOMENDADO" ||
      normalized === "NAO RECOMENDADO" ||
      normalized === "NAO RECOMENDA" ||
      normalized === "REPROVADO" ||
      normalized === "REJECTED"
    ) {
      return "not_recommended";
    }
  }

  return "unknown";
}

function getResumeHtml(oragoData: any): string | null {
  const value = oragoData?.resume?.resume;

  if (typeof value !== "string") return null;

  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function getDecisionFromResumeHtml(resumeHtml: string): OragoDecisionStatus {
  const normalized = normalizeText(resumeHtml);

  /**
   * A negativa precisa vir primeiro.
   * "NÃO SE RECOMENDA" contém a palavra "RECOMENDA".
   */
  const negativePatterns = [
    "NAO SE RECOMENDA",
    "NAO RECOMENDADO",
    "NAO E RECOMENDADO",
    "NAO RECOMENDA",
    "NAO APROVADO",
    "REPROVADO",
  ];

  if (negativePatterns.some((pattern) => normalized.includes(pattern))) {
    return "not_recommended";
  }

  const positivePatterns = [
    "RECOMENDA-SE",
    "RECOMENDA SE",
    "RECOMENDADO",
    "E RECOMENDADO",
    "APROVADO",
  ];

  if (positivePatterns.some((pattern) => normalized.includes(pattern))) {
    return "recommended";
  }

  return "unknown";
}

export function extractOragoDecision(oragoData: any): NormalizedOragoDecision {
  const structuredDecision = getStructuredDecision(oragoData);
  const resumeHtml = getResumeHtml(oragoData);
  const resumeText = resumeHtml ? stripHtml(resumeHtml) : null;

  if (structuredDecision !== "unknown") {
    return {
      status: structuredDecision,
      source: "structured_field",
      resumeHtml,
      resumeText,
    };
  }

  if (resumeHtml) {
    return {
      status: getDecisionFromResumeHtml(resumeHtml),
      source: "resume_html",
      resumeHtml,
      resumeText,
    };
  }

  return {
    status: "unknown",
    source: "unknown",
    resumeHtml: null,
    resumeText: null,
  };
}