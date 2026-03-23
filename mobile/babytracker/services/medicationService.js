import apiClient from './api';

// ─── MEDICATIONS (baby-scoped CRUD) ──────────────────────────────────────────

/**
 * Add a medication for a baby
 * @param {number} babyId
 * @param {object} data - { name, dosage?, form?, instructions?, start_date?, end_date?, prescribed_by? }
 */
export const createMedication = async (babyId, data) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/medications`, data);
    return response;
  } catch (error) {
    console.error('Failed to create medication:', error);
    return { success: false, message: error.message || 'Failed to create medication' };
  }
};

/**
 * Get all medications for a baby
 * @param {number} babyId
 */
export const getMedications = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/medications`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch medications for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch medications', data: [] };
  }
};

/**
 * Get a single medication
 * @param {number} babyId
 * @param {number} medicationId
 */
export const getMedication = async (babyId, medicationId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/medications/${medicationId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch medication ${medicationId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch medication' };
  }
};

/**
 * Update a medication
 * @param {number} babyId
 * @param {number} medicationId
 * @param {object} data - Fields to update
 */
export const updateMedication = async (babyId, medicationId, data) => {
  try {
    const response = await apiClient.put(`/babies/${babyId}/medications/${medicationId}`, data);
    return response;
  } catch (error) {
    console.error('Failed to update medication:', error);
    return { success: false, message: error.message || 'Failed to update medication' };
  }
};

/**
 * Delete a medication
 * @param {number} babyId
 * @param {number} medicationId
 */
export const deleteMedication = async (babyId, medicationId) => {
  try {
    const response = await apiClient.delete(`/babies/${babyId}/medications/${medicationId}`);
    return response;
  } catch (error) {
    console.error('Failed to delete medication:', error);
    return { success: false, message: error.message || 'Failed to delete medication' };
  }
};
