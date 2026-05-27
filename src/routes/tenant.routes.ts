import { Router } from "express";

import { TenantController } from "../controllers/tenant.controller.js";
import { authorize, ensureAuthenticated } from "../middlewares/auth.js";
import { UserRole } from "../domain/roles.js";

const tenantRoutes = Router();
const tenantController = new TenantController();

tenantRoutes.use(ensureAuthenticated);

tenantRoutes.post("/", authorize(UserRole.REAL_ESTATE), tenantController.consult);

export { tenantRoutes };