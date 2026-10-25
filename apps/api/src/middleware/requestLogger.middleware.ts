import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { logger } from "../infrastructure/logger.js";

export interface RequestWithTrace extends Request {
  requestId?: string;
}

export function requestLogger(req: RequestWithTrace, res: Response, next: NextFunction) {
  const start = Date.now();
  const requestId = (req.headers["x-request-id"] as string) || crypto.randomUUID();
  req.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  res.on("finish", () => {
    const duration = Date.now() - start;
    const level = res.statusCode >= 500 ? "error" : res.statusCode >= 400 ? "warn" : "info";

    logger.log(level, `${req.method} ${req.originalUrl || req.url} ${res.statusCode}`, {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      userAgent: req.headers["user-agent"],
      ip: req.ip,
    }, requestId);
  });

  next();
}
