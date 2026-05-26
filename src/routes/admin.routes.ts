import { Router } from "express";
import { z } from "zod";
import { UserRole } from "../domain/roles.js";
import { prisma } from "../lib/prisma.js";
import { ensureAuthenticated, requireRole } from "../middlewares/auth.js";

export const adminRoutes = Router();

const listAnalysesSchema = z.object({
  cpf: z.string().optional(),
  requesterId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(25)
});

adminRoutes.use(ensureAuthenticated, requireRole(UserRole.ADMIN));

adminRoutes.get("/analyses", async (request, response) => {
  const query = listAnalysesSchema.parse(request.query);

  const where = {
    cpf: query.cpf,
    requesterId: query.requesterId
  };

  const [analyses, total] = await Promise.all([
    prisma.analysis.findMany({
      where,
      skip: (query.page - 1) * query.perPage,
      take: query.perPage,
      orderBy: { createdAt: "desc" },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }),
    prisma.analysis.count({ where })
  ]);

  return response.json({
    analyses: analyses.map((analysis) => ({
      ...analysis,
      products: JSON.parse(analysis.products),
      result: analysis.result ? JSON.parse(analysis.result) : null
    })),
    meta: {
      page: query.page,
      perPage: query.perPage,
      total,
      lastPage: Math.ceil(total / query.perPage)
    }
  });
});
