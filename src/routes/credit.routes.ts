import { Router } from "express";
import { CreditController } from "../controllers/credit.controller.js";
import { ensureAuthenticated, authorize } from "../middlewares/auth.js";
import { UserRole } from "../domain/roles.js";

const creditRoutes = Router();
const creditController = new CreditController();

creditRoutes.use(ensureAuthenticated);

creditRoutes.get(
  "/users/:userId/wallet",
  authorize(UserRole.ADMIN),
  creditController.getWallet,
);

creditRoutes.patch(
  "/users/:userId/credits",
  authorize(UserRole.ADMIN),
  creditController.setCredits,
);

creditRoutes.patch(
  "/users/:userId/vip",
  authorize(UserRole.ADMIN),
  creditController.setVip,
);

creditRoutes.get(
  "/users/:userId/ledger",
  authorize(UserRole.ADMIN),
  creditController.listLedger,
);

export { creditRoutes };
