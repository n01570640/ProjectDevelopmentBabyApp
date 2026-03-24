import apiClient from './api';
import { apiCall } from './apiWrapper';

/**
 * Get all CDC-recommended vaccines
 */
export const getAllVaccines = () =>
  apiCall(() => apiClient.get('/guidelines/vaccines'), 'Failed to fetch vaccines', []);

/**
 * Get a specific vaccine by ID
 * @param {number} vaccineId
 */
export const getVaccine = (vaccineId) =>
  apiCall(() => apiClient.get(`/guidelines/vaccines/${vaccineId}`), 'Failed to fetch vaccine details', null);

/**
 * Get vaccine schedule for a specific age
 * @param {number} ageWeeks - baby's age in weeks
 */
export const getVaccineSchedule = (ageWeeks) =>
  apiCall(() => apiClient.get(`/guidelines/vaccines/schedule/${ageWeeks}`), 'Failed to fetch vaccine schedule', null);
