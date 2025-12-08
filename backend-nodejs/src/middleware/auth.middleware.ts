import { Request, Response, NextFunction } from "express";
import { extractTokenFromHeader, verifyToken } from "../utils/jwt.util";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Middleware to verify JWT token
export function verifyTokenMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;

    // Extract token from "Bearer token_value" format
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Missing or invalid authorization header"
      });
      return;
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      res.status(401).json({
        success: false,
        message: "Invalid or expired token"
      });
      return;
    }

    // Attach user info to request
    req.user = decoded;

    // Move to next middleware/route
    next();
  } catch (error: any) {
    res.status(401).json({
      success: false,
      message: "Authentication failed"
    });
  }
}
