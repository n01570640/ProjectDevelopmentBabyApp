import apiClient from './api';

/**
 * GET /api/v1/users/me
 * Returns the authenticated user's profile: user_id, email, full_name, phone, created_at, is_active
 */
export const getMe = async () => {
  try {
    const response = await apiClient.get('/users/me');
    return response;
  } catch (error) {
    console.error('[userService] getMe error:', error);
    if (error.response) return error.response;
    return { success: false, message: error.message || 'Failed to fetch profile' };
  }
};

/**
 * PUT /api/v1/users/me
 * Updates full_name and phone for the authenticated user.
 * @param {object} data - { full_name: string, phone?: string }
 */
export const updateMe = async (data) => {
  try {
    const response = await apiClient.put('/users/me', data);
    return response;
  } catch (error) {
    console.error('[userService] updateMe error:', error);
    if (error.response) return error.response;
    return { success: false, message: error.message || 'Failed to update profile' };
  }
};

