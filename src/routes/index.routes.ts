import { Router } from "express";

import { analysisRoutes } from "./analysis.routes.js"
import { authRoutes } from "./auth.routes.js"
import { systemRoutes } from "./system.routes.js"
import { tenantRoutes } from "./tenant.routes.js";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/analyses", analysisRoutes);
routes.use("/system", systemRoutes);
routes.use("/tenants", tenantRoutes);

export { routes };