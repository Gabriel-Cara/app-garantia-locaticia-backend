export type DecisionStatus = "approved" | "rejected" | "manual_review";

export type RecommendationStatus = "recommended" | "not_recommended" | "unknown";

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
  status: DecisionStatus;
  recommendation: RecommendationStatus;
  requestedExpense: number;
  housingExpense: HousingExpenseRange;
  reasons: string[];
}