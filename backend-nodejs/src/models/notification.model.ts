import { getDb } from "../db";
import sql from "mssql";
import {
  NotificationTokenDTO,
  NotificationLogDTO,
} from "../dtos/notification.dto";

// ─── Token Management ────────────────────────────────────────────

/**
 * Register or update a device push token for a user
 * Uses upsert pattern: if token already exists for this user+device, update it
 */
export async function registerToken(
  userId: number,
  deviceToken: string,
  platform: string,
  transactionRequest?: sql.Request
): Promise<NotificationTokenDTO> {
  const request = transactionRequest ?? (await getDb()).request();

  // Atomic upsert using MERGE to avoid TOCTOU race condition
  const result = await request
    .input("user_id", sql.BigInt, userId)
    .input("device_token", sql.NVarChar(500), deviceToken)
    .input("platform", sql.VarChar(20), platform)
    .query(`
      MERGE notification_tokens AS target
      USING (SELECT @user_id AS user_id, @device_token AS device_token) AS source
      ON target.user_id = source.user_id AND target.device_token = source.device_token
      WHEN MATCHED THEN
        UPDATE SET platform = @platform, created_at = SYSDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (user_id, device_token, platform, created_at)
        VALUES (@user_id, @device_token, @platform, SYSDATETIME())
      OUTPUT INSERTED.*;
    `);

  return result.recordset[0] as NotificationTokenDTO;
}

/**
 * Unregister a device token
 */
export async function unregisterToken(
  userId: number,
  deviceToken: string,
  transactionRequest?: sql.Request
): Promise<boolean> {
  const request = transactionRequest ?? (await getDb()).request();
  const result = await request
    .input("user_id", sql.BigInt, userId)
    .input("device_token", sql.NVarChar(500), deviceToken)
    .query(`
      DELETE FROM notification_tokens
      WHERE user_id = @user_id AND device_token = @device_token
    `);
  return result.rowsAffected[0] > 0;
}

/**
 * Get all push tokens for a user (they may have multiple devices)
 */
export async function getTokensByUserId(
  userId: number,
  transactionRequest?: sql.Request
): Promise<NotificationTokenDTO[]> {
  const request = transactionRequest ?? (await getDb()).request();
  const result = await request
    .input("user_id", sql.BigInt, userId)
    .query(`SELECT * FROM notification_tokens WHERE user_id = @user_id`);
  return result.recordset as NotificationTokenDTO[];
}

/**
 * Get all push tokens for users who have access to a specific baby
 * (Used by cron job to notify all caregivers of a baby)
 */
export async function getTokensByBabyId(
  babyId: number,
  transactionRequest?: sql.Request
): Promise<{ user_id: number; device_token: string }[]> {
  const request = transactionRequest ?? (await getDb()).request();
  const result = await request
    .input("baby_id", sql.BigInt, babyId)
    .query(`
      SELECT nt.user_id, nt.device_token
      FROM notification_tokens nt
      INNER JOIN caregiver_baby_access cba ON nt.user_id = cba.user_id
      WHERE cba.baby_id = @baby_id
    `);
  return result.recordset;
}

// ─── Notification Log ────────────────────────────────────────────

/**
 * Log a sent notification
 */
export async function logNotification(
  userId: number,
  babyId: number | null,
  title: string,
  body: string | null,
  deliveryStatus: string,
  transactionRequest?: sql.Request
): Promise<NotificationLogDTO> {
  const request = transactionRequest ?? (await getDb()).request();
  const result = await request
    .input("user_id", sql.BigInt, userId)
    .input("baby_id", sql.BigInt, babyId)
    .input("title", sql.NVarChar(200), title)
    .input("body", sql.NVarChar(500), body)
    .input("delivery_status", sql.VarChar(20), deliveryStatus)
    .query(`
      INSERT INTO notifications_log (user_id, baby_id, title, body, sent_at, delivery_status)
      OUTPUT INSERTED.*
      VALUES (@user_id, @baby_id, @title, @body, SYSDATETIME(), @delivery_status)
    `);
  return result.recordset[0] as NotificationLogDTO;
}

/**
 * Get notification history for a user
 */
export async function getNotificationsByUserId(
  userId: number,
  limit: number = 50,
  transactionRequest?: sql.Request
): Promise<NotificationLogDTO[]> {
  const request = transactionRequest ?? (await getDb()).request();
  const result = await request
    .input("user_id", sql.BigInt, userId)
    .input("limit", sql.Int, limit)
    .query(`
      SELECT TOP (@limit) *
      FROM notifications_log
      WHERE user_id = @user_id
      ORDER BY sent_at DESC
    `);
  return result.recordset as NotificationLogDTO[];
}

// ─── Reminder Queries (for cron job) ─────────────────────────────

/**
 * Get active reminders that are due now (due_at <= now AND not recently sent)
 */
export async function getDueReminders(transactionRequest?: sql.Request): Promise<Array<{
  reminder_id: number;
  baby_id: number;
  created_by: number;
  title: string;
  body: string | null;
  due_at: Date;
  rrule: string | null;
}>> {
  const request = transactionRequest ?? (await getDb()).request();
  const result = await request
    .query(`
      SELECT reminder_id, baby_id, created_by, title, body, due_at, rrule
      FROM reminders
      WHERE is_active = 1
        AND due_at <= SYSDATETIME()
        AND (last_sent_at IS NULL OR DATEDIFF(MINUTE, last_sent_at, SYSDATETIME()) >= 1)
    `);
  return result.recordset;
}

/**
 * Mark a reminder as sent (update last_sent_at)
 */
export async function markReminderSent(
  reminderId: number,
  transactionRequest?: sql.Request
): Promise<void> {
  const request = transactionRequest ?? (await getDb()).request();
  await request
    .input("reminder_id", sql.BigInt, reminderId)
    .query(`
      UPDATE reminders
      SET last_sent_at = SYSDATETIME()
      WHERE reminder_id = @reminder_id
    `);
}

/**
 * Deactivate a one-time reminder after it fires (rrule is null)
 */
export async function deactivateReminder(
  reminderId: number,
  transactionRequest?: sql.Request
): Promise<void> {
  const request = transactionRequest ?? (await getDb()).request();
  await request
    .input("reminder_id", sql.BigInt, reminderId)
    .query(`
      UPDATE reminders
      SET is_active = 0
      WHERE reminder_id = @reminder_id
    `);
}
