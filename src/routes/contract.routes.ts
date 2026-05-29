import { Router } from "express";
import { ContractController } from "../controllers/contract.controller.js";
import { ensureAuthenticated, authorize } from "../middlewares/auth.js";
import { UserRole } from "../domain/roles.js";

const contractRoutes = Router();
const contractController = new ContractController();

contractRoutes.use(ensureAuthenticated);

contractRoutes.post(
  "/applications/:applicationId/generate",
  authorize(UserRole.ADMIN),
  contractController.generate,
);

contractRoutes.get(
  "/:id/download",
  authorize(UserRole.ADMIN, UserRole.REAL_ESTATE),
  contractController.download,
);

export { contractRoutes };