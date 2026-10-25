import type { Request, Response, NextFunction } from "express";

export function validateRegisterInput(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body || {};
  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "A valid email address is required" });
  }
  if (!password || typeof password !== "string" || password.length < 8) {
    return res.status(400).json({ error: "Password must be at least 8 characters long" });
  }
  next();
}

export function validateLoginInput(req: Request, res: Response, next: NextFunction) {
  const { email, password } = req.body || {};
  if (!email || typeof email !== "string") {
    return res.status(400).json({ error: "Email is required" });
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({ error: "Password is required" });
  }
  next();
}

export function validateVerifyInput(req: Request, res: Response, next: NextFunction) {
  const { status, rejection_reason } = req.body || {};
  if (!status || !["verified", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Status must be 'verified' or 'rejected'" });
  }
  if (status === "rejected" && (!rejection_reason || typeof rejection_reason !== "string" || !rejection_reason.trim())) {
    return res.status(400).json({ error: "Rejection reason is required when status is 'rejected'" });
  }
  next();
}
