import * as notificationModel from "../models/notification.model";
import {
  NotificationTokenDTO,
  NotificationLogDTO,
} from "../dtos/notification.dto";

/**
 * Register a device push token
 */
export async function registerToken(
  userId: number,
  deviceToken: string,
  platform: string
): Promise<NotificationTokenDTO> {
  return await notificationModel.registerToken(userId, deviceToken, platform);
}

/**
 * Unregister a device push token
 */
export async function unregisterToken(
  userId: number,
  deviceToken: string
): Promise<boolean> {
  return await notificationModel.unregisterToken(userId, deviceToken);
}

/**
 * Get notification history for a user
 */
export async function getNotifications(
  userId: number,
  limit: number = 50
): Promise<NotificationLogDTO[]> {
  return await notificationModel.getNotificationsByUserId(userId, limit);
}
