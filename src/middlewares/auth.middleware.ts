// import { Request, Response, NextFunction } from "express";
// import { auth } from "@/lib/auth"; // Your Better Auth configuration
// import { users } from "@/schema/schema"; // Import your Drizzle schema

// // Infer the User type from the Drizzle schema for type safety
// type User = typeof users.$inferSelect;

// // Extend Express Request type to include a full user object, which is more useful
// declare global {
//   namespace Express {
//     interface Request {
//       user?: User; // It's better to store the whole user object
//     }
//   }
// }

// export const protectRoute = async (
//   req: Request,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     // 1. Convert Node.js `req.headers` into a standard Web API `Headers` object.
//     const headers = new Headers(req.headers as HeadersInit);

//     // 2. Call `getSession` from the `auth.api` object, passing the correct argument shape.
//     const session = await auth.api.getSession({ headers });

//     if (!session || !session.user) {
//       return res.status(401).json({
//         error: "UNAUTHORIZED",
//         message: "You must be logged in to access this resource.",
//       });
//     }

//     // 3. Attach the full user object to the request for downstream use.
//     req.user = session.user as unknown as User;
//     next();
//   } catch (error) {
//     console.error("Session validation error:", error);
//     return res.status(401).json({
//       error: "SESSION_VALIDATION_ERROR",
//       message: "Failed to validate session",
//     });
//   }
// };

// // Utility function to get current user ID
// export const getCurrentUserId = (req: Request): string | null => {
//   // Access the user from the request object populated by protectRoute
//   return req.user?.id || null;
// };

// // Utility function to check if user is authenticated (can be used if you don't need to block the route)
// export const ensureAuthenticated = async (req: Request): Promise<boolean> => {
//   try {
//     const headers = new Headers(req.headers as HeadersInit);
//     const session = await auth.api.getSession({ headers });
//     return !!(session && session.user);
//   } catch (error) {
//     return false;
//   }
// };

// src/middleware/auth.middleware.ts

import { verifyJwt } from "@/utils/common.util";
import { Request, Response, NextFunction } from "express";

// Step 1: Extend Express Request
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: string;
  };
}

// Step 2: Middleware to decode JWT and attach to req.user
export const verifyToken = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  let token: string | undefined;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }
  if(!token || req.cookies?.token){
    token = req.cookies?.token
  }

  if(!token){
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  const payload = verifyJwt<{ userId: string; email: string; role: string }>(token);
  if (!payload || !payload.userId) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }

  req.user = {
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
  };

  next();
};
