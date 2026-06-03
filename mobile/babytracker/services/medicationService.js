import apiClient from './api';
import { apiCall } from './apiWrapper';

// ─── MEDICATIONS (baby-scoped CRUD) ──────────────────────────────────────────

/**
 * Add a medication for a baby
 * @param {number} babyId
 * @param {object} data - { name, dosage?, form?, instructions?, start_date?, end_date?, prescribed_by? }
 */
export const createMedication = (babyId, data) =>
  apiCall(() => apiClient.post(`/babies/${babyId}/medications`, data), 'Failed to create medication');

/**
 * Get all medications for a baby
 * @param {number} babyId
 */
export const getMedications = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/medications`), 'Failed to fetch medications', []);

/**
 * Get a single medication
 * @param {number} babyId
 * @param {number} medicationId
 */
export const getMedication = (babyId, medicationId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/medications/${medicationId}`), 'Failed to fetch medication');

/**
 * Update a medication
 * @param {number} babyId
 * @param {number} medicationId
 * @param {object} data - Fields to update
 */
export const updateMedication = (babyId, medicationId, data) =>
  apiCall(() => apiClient.put(`/babies/${babyId}/medications/${medicationId}`, data), 'Failed to update medication');

/**
 * Delete a medication
 * @param {number} babyId
 * @param {number} medicationId
 */
export const deleteMedication = (babyId, medicationId) =>
  apiCall(() => apiClient.delete(`/babies/${babyId}/medications/${medicationId}`), 'Failed to delete medication');
