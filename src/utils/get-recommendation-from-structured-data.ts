// Schemas
import { TenantRecommendationStatus } from "../schemas/consults.schemas.js";
import { parseNumber } from "./parse-number.js";
import { parsePercentage } from "./parse-percentage.js";

export function getRecommendationFromStructuredData(oragoData: any): {
  recommendation: TenantRecommendationStatus;
  reasons: string[];
} {
  const reasons: string[] = [];

  const identity = oragoData.identity ?? oragoData.identify
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

  const creditScore = parseNumber(financial?.credit_score ?? financial?.score);

  if (creditScore !== null && creditScore < 499) {
    reasons.push(`Score de crédito baixo: ${creditScore}`);
  }

  const defaultProbability = parsePercentage(financial?.default_prob);

  if (defaultProbability !== null && defaultProbability > 20) {
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
