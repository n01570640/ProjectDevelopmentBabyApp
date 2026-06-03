import { Request, Response } from "express";
import * as notificationService from "../services/notification.service";

/**
 * POST /api/v1/notifications/register-token
 * Register a device push token for the authenticated user
 */
export async function registerToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { device_token, platform } = req.body;

    const token = await notificationService.registerToken(userId, device_token, platform);

    res.status(201).json({
      success: true,
      message: "Device token registered successfully",
      data: token,
    });
  } catch (error: any) {
    console.error("Error registering token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to register device token",
    });
  }
}

/**
 * DELETE /api/v1/notifications/register-token
 * Unregister a device push token
 */
export async function unregisterToken(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const { device_token } = req.body;

    const removed = await notificationService.unregisterToken(userId, device_token);

    if (!removed) {
      res.status(404).json({
        success: false,
        message: "Device token not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Device token unregistered successfully",
    });
  } catch (error: any) {
    console.error("Error unregistering token:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unregister device token",
    });
  }
}

/**
 * GET /api/v1/notifications
 * Get notification history for the authenticated user
 */
export async function getNotifications(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const limit = parseInt(req.query.limit as string, 10);
    const notifications = await notificationService.getNotifications(
      userId,
      isNaN(limit) ? 50 : limit
    );

    res.status(200).json({
      success: true,
      data: notifications,
      total: notifications.length,
    });
  } catch (error: any) {
    console.error("Error getting notifications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get notifications",
    });
  }
}
