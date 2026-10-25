import type { Response, NextFunction } from "express";
import type { AuthedRequest } from "./auth.middleware.js";
import type { UserRole } from "@nexus/types";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: "Insufficient permissions",
        requiredRoles: allowedRoles,
        currentRole: req.user.role,
      });
    }

    next();
  };
}
