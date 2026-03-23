/**
 * Expo Push Notification utility
 *
 * Sends push notifications via the Expo Push API.
 * No SDK or Firebase setup required — just HTTP POST to Expo's endpoint.
 *
 * Expo Push Token format: "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]"
 *
 * Docs: https://docs.expo.dev/push-notifications/sending-notifications/
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export interface ExpoPushMessage {
  to: string; // Expo push token
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
}

export interface ExpoPushReceipt {
  status: "ok" | "error";
  message?: string;
  details?: { error?: string };
}

/**
 * Send a single push notification via Expo
 */
export async function sendPushNotification(
  message: ExpoPushMessage
): Promise<ExpoPushReceipt> {
  const payload = {
    to: message.to,
    title: message.title,
    body: message.body,
    data: message.data ?? {},
    sound: message.sound ?? "default",
  };

  try {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as { data?: ExpoPushReceipt };

    if (result.data) {
      return result.data;
    }

    return { status: "error", message: "Unexpected response from Expo Push API" };
  } catch (error: any) {
    console.error("Expo push error:", error.message);
    return { status: "error", message: error.message };
  }
}

/**
 * Send push notifications to multiple tokens (batch)
 * Expo supports up to 100 messages per request
 */
export async function sendBatchPushNotifications(
  messages: ExpoPushMessage[]
): Promise<ExpoPushReceipt[]> {
  if (messages.length === 0) return [];

  // Expo recommends batches of up to 100
  const BATCH_SIZE = 100;
  const receipts: ExpoPushReceipt[] = [];

  for (let i = 0; i < messages.length; i += BATCH_SIZE) {
    const batch = messages.slice(i, i + BATCH_SIZE);

    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(batch),
      });

      const result = (await response.json()) as { data?: ExpoPushReceipt[] };

      if (result.data && Array.isArray(result.data)) {
        receipts.push(...result.data);
      }
    } catch (error: any) {
      console.error("Expo batch push error:", error.message);
      // Add error receipts for this batch
      batch.forEach(() =>
        receipts.push({ status: "error", message: error.message })
      );
    }
  }

  return receipts;
}
