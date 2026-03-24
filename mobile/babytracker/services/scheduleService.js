import apiClient from './api';
import { apiCall } from './apiWrapper';

// ─── ACTIVITIES ───────────────────────────────────────────────────────────────

/**
 * Get all activities for a baby
 */
export const getActivities = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/activities`), 'Failed to fetch activities', []);

/**
 * Create a new activity for a baby
 */
export const createActivity = (babyId, activityData) =>
  apiCall(() => apiClient.post(`/babies/${babyId}/activities`, activityData), 'Failed to create activity');

// ─── TASKS ────────────────────────────────────────────────────────────────────

/**
 * Get all tasks for a baby
 */
export const getTasks = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/tasks`), 'Failed to fetch tasks', []);

/**
 * Create a new task for a baby
 */
export const createTask = (babyId, taskData) =>
  apiCall(() => apiClient.post(`/babies/${babyId}/tasks`, taskData), 'Failed to create task');

/**
 * Update a task's status
 */
export const updateTask = (babyId, taskId, taskData) =>
  apiCall(() => apiClient.put(`/babies/${babyId}/tasks/${taskId}`, taskData), 'Failed to update task');

// ─── REMINDERS ────────────────────────────────────────────────────────────────

/**
 * Get all reminders for a baby
 */
export const getReminders = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/reminders`), 'Failed to fetch reminders', []);

/**
 * Create a new reminder for a baby
 */
export const createReminder = (babyId, reminderData) =>
  apiCall(() => apiClient.post(`/babies/${babyId}/reminders`, reminderData), 'Failed to create reminder');
