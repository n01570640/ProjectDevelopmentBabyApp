import apiClient from './api';
import { apiCall } from './apiWrapper';

// ─── BABY ANALYTICS ──────────────────────────────────────────────────────────

/**
 * Get dashboard summary for a baby
 * Returns: total activities, latest growth, symptom counts, medication counts,
 *          vaccination count, upcoming tasks/reminders, activity breakdown
 * @param {number} babyId
 */
export const getBabySummary = (babyId) =>
  apiCall(() => apiClient.get(`/analytics/baby/${babyId}/summary`), 'Failed to fetch baby summary');

/**
 * Get graph/chart data for a baby
 * Returns: growth over time, activity frequency by week, symptom frequency by week
 * @param {number} babyId
 */
export const getBabyGraphs = (babyId) =>
  apiCall(() => apiClient.get(`/analytics/baby/${babyId}/graphs`), 'Failed to fetch baby graphs');
