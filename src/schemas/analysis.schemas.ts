import z from "zod";

export const cpfSchema = z
  .string()
  .regex(
    /^\d{11}$/,
    "CPF deve conter exatamente 11 dígitos, sem pontos ou traços",
  );

export const cnpjSchema = z
  .string()
  .regex(
    /^\d{14}$/,
    "CNPJ deve conter exatamente 14 dígitos, sem pontos ou traços",
  );

const defaultPfProducts = {
  basic_data: true,
  default_financial: true,
  judicial: true,
  ai: true,
  antifraud: false,
  antifraud_pix: false,
  antifraud_quiz: false,
  banking_history: false,
  advanced_financial: false,
  pre_visit: false,
  pre_visit_judicial: false,
  financial_open_finance: false,
  biometrics_with_liveness: false,
};

const defaultPjProducts = {
  company_analysis_judicial: true,
  company_analysis_financial: true,
  ai: true,
};

export const createPfAnalysisSchema = z.object({
  cpf: cpfSchema,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  selfie: z.string().optional(),
  products: z.record(z.boolean()).default(defaultPfProducts),
});

export const analysisParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listAnalysesSchema = z.object({
  cpf: z.string().optional(),
  requesterId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(25),
});

export const consultByCpfAnalysisSchema = z.object({
  cpf: cpfSchema,
  email: z.string().email().optional(),
  phone: z.string().optional(),
  selfie: z.string().optional(),
  products: z.record(z.boolean()).default(defaultPfProducts),
  rentValue: z.number().positive(),
  condominiumValue: z.number().positive(),
  feesValue: z.number().positive(),
});

export const consultByCnpjAnalysisSchema = z.object({
  cnpj: cnpjSchema,
  products: z.record(z.boolean()).default(defaultPjProducts),
  rentValue: z.number().positive(),
  condominiumValue: z.number().positive(),
  feesValue: z.number().positive(),
});
