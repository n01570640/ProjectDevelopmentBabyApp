import apiClient from './api';
import { apiCall } from './apiWrapper';

// ─── SYMPTOMS CATALOG (reference data) ───────────────────────────────────────

/**
 * Get all symptoms from catalog
 */
export const getAllSymptoms = () =>
  apiCall(() => apiClient.get('/symptoms'), 'Failed to fetch symptoms', []);

/**
 * Get a single symptom by code
 * @param {string} code - Symptom code (e.g., 'FEVER', 'RASH')
 */
export const getSymptomByCode = (code) =>
  apiCall(() => apiClient.get(`/symptoms/${code}`), 'Failed to fetch symptom');

// ─── SYMPTOM LOGS (baby-scoped CRUD) ─────────────────────────────────────────

/**
 * Log a symptom for a baby
 * @param {number} babyId
 * @param {object} data - { symptom_code, severity_1_5?, trigger_note?, associated_med_id?, notes?, started_at? }
 */
export const createSymptomLog = (babyId, data) =>
  apiCall(() => apiClient.post(`/babies/${babyId}/symptoms`, data), 'Failed to create symptom log');

/**
 * Get symptom logs for a baby with optional filters
 * @param {number} babyId
 * @param {object} filters - { from?, to?, symptom_code? }
 */
export const getSymptomLogs = (babyId, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.symptom_code) params.append('symptom_code', filters.symptom_code);

  const queryString = params.toString();
  const endpoint = `/babies/${babyId}/symptoms${queryString ? `?${queryString}` : ''}`;

  return apiCall(() => apiClient.get(endpoint), 'Failed to fetch symptom logs', []);
};

/**
 * Get a single symptom log
 * @param {number} babyId
 * @param {number} symptomLogId
 */
export const getSymptomLog = (babyId, symptomLogId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/symptoms/${symptomLogId}`), 'Failed to fetch symptom log');

/**
 * Update a symptom log
 * @param {number} babyId
 * @param {number} symptomLogId
 * @param {object} data - Fields to update
 */
export const updateSymptomLog = (babyId, symptomLogId, data) =>
  apiCall(() => apiClient.put(`/babies/${babyId}/symptoms/${symptomLogId}`, data), 'Failed to update symptom log');

/**
 * Delete a symptom log
 * @param {number} babyId
 * @param {number} symptomLogId
 */
export const deleteSymptomLog = (babyId, symptomLogId) =>
  apiCall(() => apiClient.delete(`/babies/${babyId}/symptoms/${symptomLogId}`), 'Failed to delete symptom log');
