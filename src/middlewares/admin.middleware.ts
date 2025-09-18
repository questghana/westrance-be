import { verifyJwt } from "@/utils/common.util";
import { Request, Response, NextFunction } from "express";

// Step 1: Extend Express Request
export interface AuthenticatedRequestAdmin extends Request {
  admin?: {
    id: string;
    email: string;
    role: string;
  };
}

// Step 2: Middleware to decode JWT and attach to req.user
export const verifyTokenAdmin = (req: AuthenticatedRequestAdmin, res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  if (!token || req.cookies?.token) {
    token = req.cookies?.token
  }

  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const payload = verifyJwt<{ id: string; email: string; role: string }>(token);
  if (!payload || !payload.id) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.admin = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  next();
};
