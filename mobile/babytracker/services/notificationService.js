import apiClient from './api';

// ─── DEVICE TOKEN REGISTRATION ───────────────────────────────────────────────

/**
 * Register device push token with the backend
 * Call this on app startup after getting the Expo push token
 *
 * Usage (in a component or App.js):
 *   import * as Notifications from 'expo-notifications';
 *   const token = (await Notifications.getExpoPushTokenAsync()).data;
 *   await registerPushToken(token, Platform.OS);
 */
export const registerPushToken = async (deviceToken, platform) => {
  try {
    const response = await apiClient.post('/notifications/register-token', {
      device_token: deviceToken,
      platform: platform, // 'android' | 'ios' | 'web'
    });
    return response;
  } catch (error) {
    console.error('Failed to register push token:', error);
    return { success: false, message: error.message || 'Failed to register push token' };
  }
};

/**
 * Unregister device push token (e.g., on logout)
 * Uses POST to /unregister-token since the apiClient.delete doesn't support request body
 */
export const unregisterPushToken = async (deviceToken) => {
  try {
    const response = await apiClient.post('/notifications/unregister-token', {
      device_token: deviceToken,
    });
    return response;
  } catch (error) {
    console.error('Failed to unregister push token:', error);
    return { success: false, message: error.message || 'Failed to unregister push token' };
  }
};

// ─── NOTIFICATION HISTORY ────────────────────────────────────────────────────

/**
 * Get notification history for the authenticated user
 * @param {number} limit - Max number of notifications to return (default 50)
 */
export const getNotifications = async (limit = 50) => {
  try {
    const response = await apiClient.get(`/notifications?limit=${limit}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return { success: false, message: error.message || 'Failed to fetch notifications', data: [] };
  }
};
