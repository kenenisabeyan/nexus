import express from "express";
import cors from "cors";
import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { logger } from "./infrastructure/logger.js";
import { briefingRouter } from "./modules/briefing/briefing.routes.js";
import { searchRouter } from "./modules/search/search.routes.js";
import { sourcesRouter } from "./modules/sources/sources.routes.js";
import { knowledgeRouter } from "./modules/knowledge/knowledge.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";
import { ingestionRouter } from "./modules/ingestion/ingestion.routes.js";

export function buildApp() {
  const app = express();

  const allowedOrigin = process.env.WEB_ORIGIN ?? "http://localhost:5173";
  app.use(cors({ origin: allowedOrigin, credentials: true }));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api/auth", authRouter);
  app.use("/api/briefing", briefingRouter);
  app.use("/api/search", searchRouter);
  app.use("/api/sources", sourcesRouter);
  app.use("/api/ingestion", ingestionRouter);
  app.use("/api", knowledgeRouter);

  app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

  app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    logger.error("Unhandled API error", err, { url: req.originalUrl, method: req.method });
    res.status(500).json({ error: "Internal server error" });
  });

  return app;
}

