import { Router } from "express";

import { authRoutes } from "./auth.routes.js"
import { systemRoutes } from "./system.routes.js"
import { creditRoutes } from "./credit.routes.js";
import { rentalApplicationRoutes } from "./rental-application.routes.js";
import { contractRoutes } from "./contract.routes.js";

const routes = Router();

routes.use("/auth", authRoutes);
routes.use("/system", systemRoutes);
routes.use("/credits", creditRoutes);
routes.use("/rental-applications", rentalApplicationRoutes);
routes.use("/contracts", contractRoutes);

export { routes };