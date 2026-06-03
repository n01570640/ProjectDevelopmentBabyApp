import apiClient from './api';
import { apiCall } from './apiWrapper';

/**
 * Fetch the unified timeline for a baby.
 * Returns { success: true, data: { baby_id, items: [...], total } }
 * or     { success: false, message, data: { items: [], total: 0 } }
 *
 * @param {number} babyId
 * @param {number} [limit=50]
 * @param {number} [offset=0]
 */
export const getBabyTimeline = (babyId, limit = 50, offset = 0) =>
  apiCall(
    () => apiClient.get(`/babies/${babyId}/timeline?limit=${limit}&offset=${offset}`),
    'Failed to fetch timeline',
    { items: [], total: 0 }
  );
