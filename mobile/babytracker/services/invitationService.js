import apiClient from './api';

/**
 * Create an invitation for a baby
 * @param {number} babyId
 * @param {string} invitedEmail
 * @param {string} invitedRole - 'SECONDARY_CAREGIVER' or 'PROFESSIONAL'
 */
export const createInvitation = async (babyId, invitedEmail, invitedRole) => {
  try {
    const response = await apiClient.post(`/babies/${babyId}/invitations`, {
      invited_email: invitedEmail,
      invited_role: invitedRole,
    });
    return response;
  } catch (error) {
    console.error('Failed to create invitation:', error);
    return {
      success: false,
      message: error.message || 'Failed to create invitation',
    };
  }
};

/**
 * List pending invitations for a baby (requires can_share permission)
 * @param {number} babyId
 */
export const getInvitations = async (babyId) => {
  try {
    const response = await apiClient.get(`/babies/${babyId}/invitations`);
    return response;
  } catch (error) {
    console.error(`Failed to fetch invitations for baby ${babyId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to fetch invitations',
      data: [],
    };
  }
};

/**
 * Cancel a pending invitation
 * @param {number} babyId
 * @param {number} inviteId
 */
export const cancelInvitation = async (babyId, inviteId) => {
  try {
    const response = await apiClient.delete(`/babies/${babyId}/invitations/${inviteId}`);
    return response;
  } catch (error) {
    console.error(`Failed to cancel invitation ${inviteId}:`, error);
    return {
      success: false,
      message: error.message || 'Failed to cancel invitation',
    };
  }
};

/**
 * Get public invitation details by token (no auth required)
 * @param {string} token - invitation UUID
 */
export const getInvitationByToken = async (token) => {
  try {
    const response = await apiClient.get(`/invitations/${token}`);
    return response;
  } catch (error) {
    console.error('Failed to fetch invitation details:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch invitation details',
      data: null,
    };
  }
};

/**
 * Accept an invitation (requires auth, email must match)
 * @param {string} token - invitation UUID
 */
export const acceptInvitation = async (token) => {
  try {
    const response = await apiClient.post(`/invitations/${token}/accept`);
    return response;
  } catch (error) {
    console.error('Failed to accept invitation:', error);
    return {
      success: false,
      message: error.message || 'Failed to accept invitation',
    };
  }
};
