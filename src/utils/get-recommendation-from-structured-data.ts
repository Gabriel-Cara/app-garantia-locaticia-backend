// Schemas
import { RecommendationStatus } from "../schemas/consults.schemas.js";

export function getRecommendationFromStructuredData(oragoData: any): {
  recommendation: RecommendationStatus;
  reasons: string[];
} {
  const reasons: string[] = [];

  const identity = oragoData.identity;
  const antiFraud = oragoData.anti_fraud;
  const judicial = oragoData.judicial;
  const financial = oragoData.financial;

  if (identity?.irs_status && identity.irs_status !== "REGULAR") {
    reasons.push(`Situação do CPF: ${identity.irs_status}`);
  }

  if (antiFraud?.biometry_condition === false) {
    reasons.push("Biometria reprovada ou identidade não confirmada");
  }

  if (judicial?.hasAlertableLawSuits === true) {
    reasons.push("Possui processos judiciais alertáveis");
  }

  const creditScore = Number(financial?.credit_score ?? financial?.score);

  if (!Number.isNaN(creditScore) && creditScore < 499) {
    reasons.push(`Score de crédito baixo: ${creditScore}`);
  }

  const defaultProbability = Number(financial?.default_prob);

  if (!Number.isNaN(defaultProbability) && defaultProbability > 20) {
    reasons.push(`Probabilidade de inadimplência alta: ${defaultProbability}%`);
  }

  if (financial?.has_debts === true) {
    reasons.push("Possui registros de dívida");
  }

  if (Array.isArray(financial?.protests) && financial.protests.length >= 3) {
    reasons.push("Possui 3 ou mais protestos registrados");
  }

  if (reasons.length > 0) {
    return {
      recommendation: "not_recommended",
      reasons,
    };
  }

  return {
    recommendation: "recommended",
    reasons: [],
  };
}