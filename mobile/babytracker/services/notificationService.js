import apiClient from './api';
import { apiCall } from './apiWrapper';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// ─── PUSH REGISTRATION (DEVICE + BACKEND) ──────────────────────────────────

/**
 * Request notification permissions, get Expo push token, and register it with the backend.
 * Safe to call on login/register — silently fails if permissions denied or unavailable.
 */
export async function registerForPushNotifications() {
  try {
    // Request permission
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    // Get the Expo push token
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;

    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    const expoPushToken = tokenData.data;

    // Send to backend
    await registerPushToken(expoPushToken, Platform.OS);

    return expoPushToken;
  } catch (err) {
    console.warn('[Push] Failed to register for push notifications:', err);
    return null;
  }
}

// ─── DEVICE TOKEN API CALLS ─────────────────────────────────────────────────

/**
 * Register device push token with the backend
 */
export const registerPushToken = (deviceToken, platform) =>
  apiCall(
    () => apiClient.post('/notifications/register-token', {
      device_token: deviceToken,
      platform: platform,
    }),
    'Failed to register push token'
  );

/**
 * Unregister device push token (e.g., on logout)
 */
export const unregisterPushToken = (deviceToken) =>
  apiCall(
    () => apiClient.post('/notifications/unregister-token', {
      device_token: deviceToken,
    }),
    'Failed to unregister push token'
  );

// ─── NOTIFICATION HISTORY ────────────────────────────────────────────────────

/**
 * Get notification history for the authenticated user
 * @param {number} limit - Max number of notifications to return (default 50)
 */
export const getNotifications = (limit = 50) =>
  apiCall(() => apiClient.get(`/notifications?limit=${limit}`), 'Failed to fetch notifications', []);
