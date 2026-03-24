import cron from "node-cron";
import * as notificationModel from "../models/notification.model";
import { sendBatchPushNotifications, ExpoPushMessage } from "../utils/expo-push.util";

/**
 * Reminder Notification Cron Job
 *
 * Runs every minute, checks for due reminders, and sends push notifications
 * to all caregivers of the baby associated with the reminder.
 *
 * Flow:
 * 1. Query reminders where is_active=1 AND due_at <= now AND not recently sent
 * 2. For each due reminder, get push tokens for all caregivers of that baby
 * 3. Send push notifications via Expo Push API
 * 4. Log notifications in notifications_log
 * 5. Mark reminder as sent (update last_sent_at)
 * 6. Deactivate one-time reminders (rrule is null)
 */

let isRunning = false;

async function processReminders(): Promise<void> {
  // Prevent overlapping runs
  if (isRunning) return;
  isRunning = true;

  try {
    const dueReminders = await notificationModel.getDueReminders();

    if (dueReminders.length === 0) {
      return;
    }

    console.log(`[Cron] Processing ${dueReminders.length} due reminder(s)`);

    for (const reminder of dueReminders) {
      try {
        // Get push tokens for all caregivers of this baby
        const tokens = await notificationModel.getTokensByBabyId(reminder.baby_id);

        if (tokens.length === 0) {
          // No registered devices, still mark as sent to avoid retrying every minute
          await notificationModel.markReminderSent(reminder.reminder_id);
          // Deactivate one-time reminders even with no tokens
          if (!reminder.rrule) {
            await notificationModel.deactivateReminder(reminder.reminder_id);
          }
          continue;
        }

        // Build push messages
        const messages: ExpoPushMessage[] = tokens.map((t) => ({
          to: t.device_token,
          title: reminder.title,
          body: reminder.body ?? "",
          data: {
            type: "REMINDER",
            reminder_id: reminder.reminder_id,
            baby_id: reminder.baby_id,
          },
        }));

        // Send batch
        const receipts = await sendBatchPushNotifications(messages);
        // Log each notification
        for (let i = 0; i < tokens.length; i++) {
          const receipt = receipts[i];
          const status = receipt?.status === "ok" ? "DELIVERED" : "FAILED";

          await notificationModel.logNotification(
            tokens[i].user_id,
            reminder.baby_id,
            reminder.title,
            reminder.body,
            status
          );
        }

        // Mark reminder as sent
        await notificationModel.markReminderSent(reminder.reminder_id);

        // Deactivate one-time reminders (no rrule)
        if (!reminder.rrule) {
          await notificationModel.deactivateReminder(reminder.reminder_id);
        }

        console.log(
          `[Cron] Reminder #${reminder.reminder_id} sent to ${tokens.length} device(s)`
        );
      } catch (err: any) {
        console.error(
          `[Cron] Error processing reminder #${reminder.reminder_id}:`,
          err.message
        );
      }
    }
  } catch (err: any) {
    console.error("[Cron] Error in reminder cron job:", err.message);
  } finally {
    isRunning = false;
  }
}

/**
 * Start the reminder cron job
 * Runs every minute: "* * * * *"
 */
export function startReminderCron(): void {
  cron.schedule("* * * * *", () => {
    processReminders();
  });

  console.log("[Cron] Reminder notification cron job started (runs every minute)");
}
