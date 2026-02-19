import apiClient from './api';

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

/**
 * Get all activities for a baby
 */
export const getActivities = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/activities`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch activities for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch activities', data: [] };
  }
};

/**
 * Create a new activity for a baby
 */
export const createActivity = async (babyId, activityData) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/activities`, activityData);
    return response;
  } catch (error) {
    console.error('Failed to create activity:', error);
    return { success: false, message: error.message || 'Failed to create activity' };
  }
};

// ─── TASKS ────────────────────────────────────────────────────────────────────

/**
 * Get all tasks for a baby
 */
export const getTasks = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/tasks`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch tasks for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch tasks', data: [] };
  }
};

/**
 * Create a new task for a baby
 */
export const createTask = async (babyId, taskData) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/tasks`, taskData);
    return response;
  } catch (error) {
    console.error('Failed to create task:', error);
    return { success: false, message: error.message || 'Failed to create task' };
  }
};

/**
 * Update a task's status
 */
export const updateTask = async (babyId, taskId, taskData) => {
  try {
    const response = await apiClient.put(`/babies/${babyId}/tasks/${taskId}`, taskData);
    return response;
  } catch (error) {
    console.error('Failed to update task:', error);
    return { success: false, message: error.message || 'Failed to update task' };
  }
};

// ─── REMINDERS ────────────────────────────────────────────────────────────────

/**
 * Get all reminders for a baby
 */
export const getReminders = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/reminders`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch reminders for baby ${babyId}:`, error);
    return { success: false, message: error.message || 'Failed to fetch reminders', data: [] };
  }
};

/**
 * Create a new reminder for a baby
 */
export const createReminder = async (babyId, reminderData) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/reminders`, reminderData);
    return response;
  } catch (error) {
    console.error('Failed to create reminder:', error);
    return { success: false, message: error.message || 'Failed to create reminder' };
  }
};

