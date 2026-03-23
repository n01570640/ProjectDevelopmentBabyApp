/**
 * DTOs for notification system
 */

// Register device push token
export interface RegisterTokenDTO {
  device_token: string;
  platform: string; // 'android' | 'ios' | 'web'
}

// Notification token from database
export interface NotificationTokenDTO {
  token_id: number;
  user_id: number;
  device_token: string;
  platform: string;
  created_at: string;
}

// Notification log from database
export interface NotificationLogDTO {
  notif_id: number;
  user_id: number;
  baby_id: number | null;
  title: string;
  body: string | null;
  sent_at: string;
  delivery_status: string;
}
