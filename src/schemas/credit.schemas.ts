// Libs
import { z } from "zod";

export const userIdParamsSchema = z.object({
  userId: z.string().uuid(),
});

export const setCreditsSchema = z.object({
  credits: z.coerce.number().int().min(0),
  reason: z.string().optional(),
});

export const setVipSchema = z.object({
  isVip: z.boolean(),
  reason: z.string().optional(),
});