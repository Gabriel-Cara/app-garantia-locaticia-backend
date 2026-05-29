export type TenantDecisionStatus = "approved" | "rejected" | "manual_review";

export type TenantRecommendationStatus =
  | "recommended"
  | "not_recommended"
  | "unknown";

export interface HousingExpenseRange {
  min: number | null;
  max: number | null;
  raw: string | null;
}

export interface TenantDecisionInput {
  rentValue: number;
  condominiumValue: number;
  feesValue: number;
}

export interface TenantDecisionResult {
  status: TenantDecisionStatus;
  recommendation: TenantRecommendationStatus;
  requestedExpense: number;
  housingExpense: HousingExpenseRange;
  reasons: string[];
  metadata?: Record<string, unknown>;
}

