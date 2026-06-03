import { Router } from "express";
import { CreditController } from "../controllers/credit.controller.js";
import { ensureAuthenticated, authorize } from "../middlewares/auth.js";
import { UserRole } from "../domain/roles.js";
import { asyncHandler } from "../middlewares/async-handler.js";

const creditRoutes = Router();
const creditController = new CreditController();

creditRoutes.use(ensureAuthenticated);

creditRoutes.get(
  "/users/:userId/wallet",
  authorize(UserRole.ADMIN),
  asyncHandler(creditController.getWallet),
);

creditRoutes.patch(
  "/users/:userId/credits",
  authorize(UserRole.ADMIN),
  asyncHandler(creditController.setCredits),
);

creditRoutes.patch(
  "/users/:userId/vip",
  authorize(UserRole.ADMIN),
  asyncHandler(creditController.setVip),
);

creditRoutes.get(
  "/users/:userId/ledger",
  authorize(UserRole.ADMIN),
  asyncHandler(creditController.listLedger),
);

export { creditRoutes };
