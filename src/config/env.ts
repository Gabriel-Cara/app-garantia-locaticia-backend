import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(3333),
  HOST: z.string().default("localhost"),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(24, "JWT_SECRET deve ter ao menos 24 caracteres"),
  ORAGO_BASE_URL: z.string().url(),
  ORAGO_API_TOKEN: z.string().min(1),
  CONTRACT_TEMPLATE_PATH: z.string().default("src/templates/default-rental-contract.docx"),
  CONTRACT_OUTPUT_DIR: z.string().default("storage/contracts"),
});

export const env = envSchema.parse(process.env);
