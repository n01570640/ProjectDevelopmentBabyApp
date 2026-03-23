import { Request, Response, NextFunction } from "express";
import * as caregiverAccessModel from "../models/caregiver-access.model";
import { Permission, AccessRole, CaregiverAccessDTO } from "../dtos/caregiver-access.dto";

// Extend Express Request to include baby access info
declare global {
  namespace Express {
    interface Request {
      babyAccess?: CaregiverAccessDTO;
    }
  }
}

/**
 * Middleware to check if user has ANY access to the baby
 * Requires :babyId param in route
 * Attaches access info to req.babyAccess
 */
export async function requireBabyAccess(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (!babyId || isNaN(babyId)) {
      res.status(400).json({
        success: false,
        message: "Valid baby ID is required",
      });
      return;
    }

    const access = await caregiverAccessModel.getUserBabyAccess(userId, babyId);

    if (!access) {
      res.status(403).json({
        success: false,
        message: "You do not have access to this baby",
      });
      return;
    }

    // Attach access info to request for downstream use
    req.babyAccess = access;
    next();
  } catch (error: any) {
    console.error("Error checking baby access:", error);
    res.status(500).json({
      success: false,
      message: "Error checking baby access",
    });
  }
}

/**
 * Factory function to create middleware that checks for specific permission
 * Must be used AFTER requireBabyAccess middleware
 */
export function requirePermission(permission: Permission) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      // If babyAccess is already attached (from requireBabyAccess), use it
      if (req.babyAccess) {
        if (req.babyAccess[permission]) {
          next();
          return;
        } else {
          res.status(403).json({
            success: false,
            message: `You do not have ${permission.replace(/_/g, " ")} permission`,
          });
          return;
        }
      }

      // Fallback: check permission directly
      const userId = req.user?.user_id;
      const babyId = parseInt(req.params.babyId, 10);

      if (!userId || !babyId || isNaN(babyId)) {
        res.status(400).json({
          success: false,
          message: "Valid user and baby ID required",
        });
        return;
      }

      const hasPermission = await caregiverAccessModel.checkPermission(
        userId,
        babyId,
        permission
      );

      if (!hasPermission) {
        res.status(403).json({
          success: false,
          message: `You do not have ${permission.replace(/_/g, " ")} permission`,
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error("Error checking permission:", error);
      res.status(500).json({
        success: false,
        message: "Error checking permission",
      });
    }
  };
}

/**
 * Middleware to check if user is PRIMARY_CAREGIVER for the baby
 * Must be used AFTER requireBabyAccess middleware
 */
export async function requirePrimaryCaregiver(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // If babyAccess is already attached, use it
    if (req.babyAccess) {
      if (req.babyAccess.access_role === AccessRole.PRIMARY_CAREGIVER) {
        next();
        return;
      } else {
        res.status(403).json({
          success: false,
          message: "Only the primary caregiver can perform this action",
        });
        return;
      }
    }

    // Fallback: check directly
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (!userId || !babyId || isNaN(babyId)) {
      res.status(400).json({
        success: false,
        message: "Valid user and baby ID required",
      });
      return;
    }

    const isPrimary = await caregiverAccessModel.isPrimaryCaregiver(
      userId,
      babyId
    );

    if (!isPrimary) {
      res.status(403).json({
        success: false,
        message: "Only the primary caregiver can perform this action",
      });
      return;
    }

    next();
  } catch (error: any) {
    console.error("Error checking caregiver status:", error);
    res.status(500).json({
      success: false,
      message: "Error checking caregiver status",
    });
  }
}

/**
 * Middleware to check if user is the creator of a resource
 * Requires resource to have created_by or recorded_by field
 */
export function requireCreator(creatorField: string = "created_by") {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.user_id;
      const resourceCreatorId = (req as any).resource?.[creatorField];

      if (!userId) {
        res.status(401).json({
          success: false,
          message: "Authentication required",
        });
        return;
      }

      if (!resourceCreatorId) {
        res.status(500).json({
          success: false,
          message: "Cannot verify resource ownership",
        });
        return;
      }

      if (resourceCreatorId !== userId) {
        res.status(403).json({
          success: false,
          message: "Only the creator can perform this action",
        });
        return;
      }

      next();
    } catch (error: any) {
      console.error("Error checking creator status:", error);
      res.status(500).json({
        success: false,
        message: "Error checking creator status",
      });
    }
  };
}
