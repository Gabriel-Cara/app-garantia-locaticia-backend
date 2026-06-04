// Libs
import { Router } from "express";

// Controllers
import { AuthController } from "../controllers/auth.controller.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const authRoutes = Router();
const authController = new AuthController();

authRoutes.post("/register", asyncHandler(authController.register));

authRoutes.post("/login", asyncHandler(authController.login));

authRoutes.post("/forgot-password", asyncHandler(authController.forgotPassword));

authRoutes.post("/reset-password", asyncHandler(authController.resetPassword));

export { authRoutes };