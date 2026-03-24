import apiClient from './api';
import { apiCall } from './apiWrapper';

/**
 * List all caregivers for a baby (with name + email)
 * @param {number} babyId
 */
export const getCaregivers = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/caregivers`), 'Failed to fetch caregivers', []);

/**
 * Remove a caregiver's access to a baby (requires PRIMARY role)
 * @param {number} babyId
 * @param {number} userId
 */
export const removeCaregiver = (babyId, userId) =>
  apiCall(() => apiClient.delete(`/babies/${babyId}/caregivers/${userId}`), 'Failed to remove caregiver');
