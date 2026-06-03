import { Request, Response } from "express";
import * as userModel from "../models/user.model";

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's profile data.
 */
export async function getMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const user = await userModel.findUserById(userId);
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    // Strip password_hash before returning
    const { password_hash, ...safeUser } = user as any;

    res.status(200).json({ success: true, data: safeUser });
  } catch (error: any) {
    console.error("[user.controller] getMe error:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to fetch user profile" });
  }
}

/**
 * PUT /api/v1/users/me
 * Updates the authenticated user's editable profile fields (full_name, phone).
 */
export async function updateMe(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { full_name, phone } = req.body;

    if (!full_name || !full_name.trim()) {
      res.status(400).json({ success: false, message: "full_name is required" });
      return;
    }

    const updated = await userModel.updateUser(userId, {
      full_name: full_name.trim(),
      phone: phone?.trim() || null,
    });

    if (!updated) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    const { password_hash, ...safeUser } = updated as any;

    res.status(200).json({ success: true, message: "Profile updated successfully", data: safeUser });
  } catch (error: any) {
    console.error("[user.controller] updateMe error:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to update user profile" });
  }
}

