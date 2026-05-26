import { Router } from "express";
import { ensureAuthenticated } from "../middlewares/auth.js";
import { oragoClient } from "../services/orago-client.js";

export const systemRoutes = Router();

systemRoutes.use(ensureAuthenticated);

systemRoutes.get("/health-check", async (_request, response) => {
  const health = await oragoClient.healthCheck();
  return response.json({ health });
});

systemRoutes.get("/available-products", async (_request, response) => {
  const products = await oragoClient.availableProducts();
  return response.json({ products });
});
