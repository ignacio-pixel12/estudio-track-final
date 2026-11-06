import cors from "cors";
import express from "express";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";
import { tasksRouter } from "./routes/tasks.routes.js";
import { subjectsRouter } from "./routes/subjects.routes.js";
import { statsRouter } from "./routes/stats.routes.js";

export function createApp({ service, corsOrigin = "*" }) {
  const app = express();

  app.use(cors({ origin: corsOrigin }));
  app.use(express.json({ limit: "100kb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", service: "estudio-track-api", timestamp: new Date().toISOString() });
  });

  app.use("/api/subjects", subjectsRouter(service));
  app.use("/api/tasks", tasksRouter(service));
  app.use("/api/stats", statsRouter(service));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
