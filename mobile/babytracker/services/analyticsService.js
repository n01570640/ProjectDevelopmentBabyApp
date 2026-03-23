import apiClient from './api';

// ─── BABY ANALYTICS ──────────────────────────────────────────────────────────

/**
 * Get dashboard summary for a baby
 * Returns: total activities, latest growth, symptom counts, medication counts,
 *          vaccination count, upcoming tasks/reminders, activity breakdown
 * @param {number} babyId
 */
export const getBabySummary = async (babyId) => {
  try {
    const response = await apiClient.get(`/analytics/baby/${babyId}/summary`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch summary for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch baby summary' };
  }
};

/**
 * Get graph/chart data for a baby
 * Returns: growth over time, activity frequency by week, symptom frequency by week
 * @param {number} babyId
 */
export const getBabyGraphs = async (babyId) => {
  try {
    const response = await apiClient.get(`/analytics/baby/${babyId}/graphs`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch graphs for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch baby graphs' };
  }
};
