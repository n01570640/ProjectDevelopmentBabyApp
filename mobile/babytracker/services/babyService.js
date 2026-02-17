import apiClient from './api';

/**
 * Get all babies accessible by the authenticated user
 * Returns babies with latest growth metrics and primary caregiver name
 */
export const getBabies = async () => {
  try {
    const response = await apiClient.get('/babies');
    return response;
  } catch (error) {
    console.error('Failed to fetch babies:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch babies',
      data: [],
    };
  }
};

/**
 * Get a single baby by ID with full details
 */
export const getBaby = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to fetch baby details',
      data: null,
    };
  }
};

/**
 * Create a new baby
 */
export const createBaby = async (babyData) => {
  try {
    const response = await apiClient.post('/babies', babyData);
    return response;
  } catch (error) {
    console.error('Failed to create baby:', error);
    return {
      success: false,
      message: error.message || 'Failed to create baby',
    };
  }
};

/**
 * Update baby details
 */
export const updateBaby = async (babyId, babyData) => {
  try {
    const response = await apiClient.put(`/babies/${babyId}`, babyData);
    return response;
  } catch (error) {
    console.error(`Failed to update baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to update baby',
    };
  }
};

/**
 * Delete a baby
 */
export const deleteBaby = async (babyId) => {
  try {
    const response = await apiClient.delete(`/babies/${babyId}`);
    return response;
  } catch (error) {
    console.error(`Failed to delete baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to delete baby',
    };
  }
};

/**
 * Get growth history for a baby
 */
export const getGrowthHistory = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/growth`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch growth history for baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to fetch growth history',
      data: [],
    };
  }
};

/**
 * Get latest growth metrics for a baby
 */
export const getLatestGrowth = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/growth/latest`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch latest growth for baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to fetch latest growth',
      data: null,
    };
  }
};

/**
 * Record new growth metrics for a baby
 */
export const recordGrowth = async (babyId, growthData) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/growth`, growthData);
    return response;
  } catch (error) {
    console.error(`Failed to record growth for baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to record growth',
    };
  }
};
