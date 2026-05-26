export const UserRole = {
  ADMIN: "ADMIN",
  REAL_ESTATE: "REAL_ESTATE"
} as const;

export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const AnalysisStatus = {
  CREATED: "CREATED",
  READY: "READY",
  FAILED: "FAILED"
} as const;

export type AnalysisStatus = (typeof AnalysisStatus)[keyof typeof AnalysisStatus];
