import type { RequestHandler } from "express";
import { getCurrentUserId } from "./replitAuth.js";

declare global {
  namespace Express {
    interface Request {
      userId: string | null;
    }
  }
}

export const attachUserId: RequestHandler = (req, res, next) => {
  req.userId = getCurrentUserId(req);
  next();
};

export const requireAuth: RequestHandler = (req, res, next) => {
  if (!req.userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }
  next();
};
