import { UserRole } from "../domain/roles.js";
import z from "zod";

export const registerSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  role: z
    .enum([UserRole.ADMIN, UserRole.REAL_ESTATE])
    .default(UserRole.REAL_ESTATE),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
