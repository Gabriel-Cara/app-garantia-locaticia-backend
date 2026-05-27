import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";

import { errorHandler } from "./middlewares/error-handler.js";
import { routes } from "./routes/index.routes.js";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "8mb" }));
app.use(morgan("dev"));

app.get("/health", (_request, response) => {
  return response.json({ status: "ok" });
});

app.use(routes);

app.use(errorHandler);
