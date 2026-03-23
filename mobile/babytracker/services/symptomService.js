import apiClient from './api';

// ─── SYMPTOMS CATALOG (reference data) ───────────────────────────────────────

/**
 * Get all symptoms from catalog
 */
export const getAllSymptoms = async () => {
  try {
    const response = await apiClient.get('/symptoms');
    return response;
  } catch (error) {
    console.error('Failed to fetch symptoms catalog:', error);
    return { success: false, message: error.message || 'Failed to fetch symptoms', data: [] };
  }
};

/**
 * Get a single symptom by code
 * @param {string} code - Symptom code (e.g., 'FEVER', 'RASH')
 */
export const getSymptomByCode = async (code) => {
  try {
    const response = await apiClient.get(`/symptoms/${code}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch symptom ${code}:`, error);
    return { success: false, message: error.message || 'Failed to fetch symptom' };
  }
};

// ─── TRIGGER TYPES (reference data) ──────────────────────────────────────────

/**
 * Get all trigger types for dropdowns
 */
export const getTriggerTypes = async () => {
  try {
    const response = await apiClient.get('/trigger-types');
    return response;
  } catch (error) {
    console.error('Failed to fetch trigger types:', error);
    return { success: false, message: error.message || 'Failed to fetch trigger types', data: [] };
  }
};

// ─── SYMPTOM LOGS (baby-scoped CRUD) ─────────────────────────────────────────

/**
 * Log a symptom for a baby
 * @param {number} babyId
 * @param {object} data - { symptom_code, severity_1_5?, trigger_type?, trigger_note?, associated_med_id?, notes?, started_at? }
 */
export const createSymptomLog = async (babyId, data) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/symptoms`, data);
    return response;
  } catch (error) {
    console.error('Failed to create symptom log:', error);
    return { success: false, message: error.message || 'Failed to create symptom log' };
  }
};

/**
 * Get symptom logs for a baby with optional filters
 * @param {number} babyId
 * @param {object} filters - { from?, to?, symptom_code?, trigger_type? }
 */
export const getSymptomLogs = async (babyId, filters = {}) => {
  try {
    const params = new URLSearchParams();
    if (filters.from) params.append('from', filters.from);
    if (filters.to) params.append('to', filters.to);
    if (filters.symptom_code) params.append('symptom_code', filters.symptom_code);
    if (filters.trigger_type) params.append('trigger_type', filters.trigger_type);

    const queryString = params.toString();
    const endpoint = `/babies/${babyId}/symptoms${queryString ? `?${queryString}` : ''}`;

    const response = await apiClient.get(endpoint);
    return response;
  } catch (error) {
    console.error(`Failed to fetch symptom logs for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch symptom logs', data: [] };
  }
};

/**
 * Get a single symptom log
 * @param {number} babyId
 * @param {number} symptomLogId
 */
export const getSymptomLog = async (babyId, symptomLogId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/symptoms/${symptomLogId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch symptom log ${symptomLogId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch symptom log' };
  }
};

/**
 * Update a symptom log
 * @param {number} babyId
 * @param {number} symptomLogId
 * @param {object} data - Fields to update
 */
export const updateSymptomLog = async (babyId, symptomLogId, data) => {
  try {
    const response = await apiClient.put(`/babies/${babyId}/symptoms/${symptomLogId}`, data);
    return response;
  } catch (error) {
    console.error('Failed to update symptom log:', error);
    return { success: false, message: error.message || 'Failed to update symptom log' };
  }
};

/**
 * Delete a symptom log
 * @param {number} babyId
 * @param {number} symptomLogId
 */
export const deleteSymptomLog = async (babyId, symptomLogId) => {
  try {
    const response = await apiClient.delete(`/babies/${babyId}/symptoms/${symptomLogId}`);
    return response;
  } catch (error) {
    console.error('Failed to delete symptom log:', error);
    return { success: false, message: error.message || 'Failed to delete symptom log' };
  }
};
