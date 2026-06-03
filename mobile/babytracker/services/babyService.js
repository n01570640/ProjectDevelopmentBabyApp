import apiClient from './api';
import { apiCall } from './apiWrapper';

/**
 * Get all babies accessible by the authenticated user
 * Returns babies with latest growth metrics and primary caregiver name
 */
export const getBabies = () =>
  apiCall(() => apiClient.get('/babies'), 'Failed to fetch babies', []);

/**
 * Get a single baby by ID with full details
 */
export const getBaby = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}`), 'Failed to fetch baby details', null);

/**
 * Create a new baby
 */
export const createBaby = (babyData) =>
  apiCall(() => apiClient.post('/babies', babyData), 'Failed to create baby');

/**
 * Update baby details
 */
export const updateBaby = (babyId, babyData) =>
  apiCall(() => apiClient.put(`/babies/${babyId}`, babyData), 'Failed to update baby');

/**
 * Delete a baby
 */
export const deleteBaby = (babyId) =>
  apiCall(() => apiClient.delete(`/babies/${babyId}`), 'Failed to delete baby');

/**
 * Get growth history for a baby
 */
export const getGrowthHistory = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/growth`), 'Failed to fetch growth history', []);

/**
 * Get latest growth metrics for a baby
 */
export const getLatestGrowth = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/growth/latest`), 'Failed to fetch latest growth', null);

/**
 * Record new growth metrics for a baby
 */
export const recordGrowth = (babyId, growthData) =>
  apiCall(() => apiClient.post(`/babies/${babyId}/growth`, growthData), 'Failed to record growth');
