import { env } from "../config/env.js";
import { AppError } from "../middlewares/error-handler.js";

export type CreatePfAnalysisInput = {
  cpf: string;
  email?: string;
  phone?: string;
  selfie?: string;
  products: Record<string, boolean>;
};

type OragoCreateAnalysisResponse = {
  status: number;
  error: boolean;
  message: string;
  analysis_id: string;
};

type OragoCollectResponse = {
  status: number;
  error: boolean;
  ready: boolean;
  message: string;
  data?: unknown;
};

async function requestOrago<T>(path: string, init: RequestInit = {}) {
  const response = await fetch(`${env.ORAGO_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${env.ORAGO_API_TOKEN}`,
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers
    }
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new AppError(response.status, body?.message ?? "Erro ao chamar API da Órago");
  }

  return body as T;
}

export const oragoClient = {
  createPfAnalysis(input: CreatePfAnalysisInput) {
    return requestOrago<OragoCreateAnalysisResponse>("/api/v1/analysis/pf", {
      method: "POST",
      body: JSON.stringify(input)
    });
  },

  collectAnalysis(analysisId: string) {
    return requestOrago<OragoCollectResponse>("/api/v1/analysis/collect", {
      method: "POST",
      body: JSON.stringify({ analysis_id: analysisId })
    });
  },

  availableProducts() {
    return requestOrago<Record<string, string>>("/api/v1/system/available-products");
  },

  healthCheck() {
    return requestOrago<unknown>("/api/v1/system/health-check");
  }
};
