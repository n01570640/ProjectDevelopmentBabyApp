import { Request, Response } from "express";
import * as caregiverService from "../services/caregiver.service";

/**
 * GET /api/v1/babies/:babyId/caregivers
 * List all caregivers for a baby with user details
 */
export async function listCaregivers(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const caregivers = await caregiverService.listCaregivers(babyId);

    // Map role_name to access_role for frontend compatibility
    const response = caregivers.map((c) => ({
      ...c,
      access_role: c.role_name,
    }));

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error("Error listing caregivers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list caregivers",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/caregivers/:userId
 * Remove a caregiver's access (requires PRIMARY_CAREGIVER role)
 */
export async function removeCaregiver(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const requestingUserId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);
    const userId = parseInt(req.params.userId, 10);

    if (isNaN(babyId) || isNaN(userId)) {
      res
        .status(400)
        .json({ success: false, message: "Invalid baby ID or user ID" });
      return;
    }

    if (!requestingUserId) {
      res
        .status(401)
        .json({ success: false, message: "Authentication required" });
      return;
    }

    // Prevent self-removal through this endpoint
    if (requestingUserId === userId) {
      res.status(400).json({
        success: false,
        message: "Cannot remove yourself through this endpoint",
      });
      return;
    }

    const removed = await caregiverService.removeAccess(userId, babyId);

    if (!removed) {
      res.status(404).json({
        success: false,
        message: "Caregiver access not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Caregiver removed successfully",
    });
  } catch (error: any) {
    console.error("Error removing caregiver:", error);

    if (error.message?.includes("sole primary caregiver")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to remove caregiver",
    });
  }
}
