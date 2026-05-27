import { Router } from "express";
import { UserRole } from "../domain/roles.js";
import { ensureAuthenticated, authorize } from "../middlewares/auth.js";
import { AnalysisController } from "../controllers/analysis.controller.js";

const analysisRoutes = Router();
const analysisController = new AnalysisController();

analysisRoutes.use(ensureAuthenticated);

analysisRoutes.post("/pf", authorize(UserRole.REAL_ESTATE), analysisController.create);
analysisRoutes.get("/mine", authorize(UserRole.REAL_ESTATE), analysisController.listMine);
analysisRoutes.get("/:id", authorize(UserRole.REAL_ESTATE), analysisController.getById);
analysisRoutes.post("/:id/collect", authorize(UserRole.REAL_ESTATE), analysisController.collect);
analysisRoutes.get("/", authorize(UserRole.ADMIN), analysisController.list);

export { analysisRoutes };