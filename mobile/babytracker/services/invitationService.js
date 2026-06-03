import apiClient from './api';
import { apiCall } from './apiWrapper';

/**
 * Create an invitation for a baby
 * @param {number} babyId
 * @param {string} invitedEmail
 * @param {number} invitedRole - Role ID (2 = SECONDARY_CAREGIVER, 3 = PROFESSIONAL)
 */
export const createInvitation = (babyId, invitedEmail, invitedRole) =>
  apiCall(
    () => apiClient.post(`/babies/${babyId}/invitations`, {
      invited_email: invitedEmail,
      invited_role: invitedRole,
    }),
    'Failed to create invitation'
  );

/**
 * List pending invitations for a baby (requires can_share permission)
 * @param {number} babyId
 */
export const getInvitations = (babyId) =>
  apiCall(() => apiClient.get(`/babies/${babyId}/invitations`), 'Failed to fetch invitations', []);

/**
 * Cancel a pending invitation
 * @param {number} babyId
 * @param {number} inviteId
 */
export const cancelInvitation = (babyId, inviteId) =>
  apiCall(() => apiClient.delete(`/babies/${babyId}/invitations/${inviteId}`), 'Failed to cancel invitation');

/**
 * Get public invitation details by token (no auth required)
 * @param {string} token - invitation UUID
 */
export const getInvitationByToken = (token) =>
  apiCall(() => apiClient.get(`/invitations/${token}`), 'Failed to fetch invitation details', null);

/**
 * Accept an invitation (requires auth, email must match)
 * @param {string} token - invitation UUID
 */
export const acceptInvitation = (token) =>
  apiCall(() => apiClient.post(`/invitations/${token}/accept`), 'Failed to accept invitation');
