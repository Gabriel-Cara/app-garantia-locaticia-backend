import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { adminRoutes } from "./routes/admin.routes.js";
import { analysisRoutes } from "./routes/analysis.routes.js";
import { authRoutes } from "./routes/auth.routes.js";
import { systemRoutes } from "./routes/system.routes.js";
import { errorHandler } from "./middlewares/error-handler.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  return response.json({ status: "ok" });
});

app.use("/auth", authRoutes);
app.use("/analyses", analysisRoutes);
app.use("/admin", adminRoutes);
app.use("/system", systemRoutes);

app.use(errorHandler);
