import apiClient from './api';

/**
 * Get all CDC-recommended vaccines
 */
export const getAllVaccines = async () => {
  try {
    const response = await apiClient.get('/guidelines/vaccines');
    return response;
  } catch (error) {
    console.error('Failed to fetch vaccines:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch vaccines',
      data: [],
    };
  }
};

/**
 * Get a specific vaccine by ID
 * @param {number} vaccineId
 */
export const getVaccine = async (vaccineId) => {
  try {
    const response = await apiClient.get(`/guidelines/vaccines/${vaccineId}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch vaccine ${vaccineId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to fetch vaccine details',
      data: null,
    };
  }
};

/**
 * Get vaccine schedule for a specific age
 * @param {number} ageWeeks - baby's age in weeks
 */
export const getVaccineSchedule = async (ageWeeks) => {
  try {
    const response = await apiClient.get(`/guidelines/vaccines/schedule/${ageWeeks}`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch vaccine schedule for ${ageWeeks} weeks:`, error);
    return {
      success: false,
      message: error.message || 'Failed to fetch vaccine schedule',
      data: null,
    };
  }
};
