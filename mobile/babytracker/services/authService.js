import apiClient from './api';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Register a new user
export const registerUser = async (userData) => {
  try {
    // Map frontend field names to backend field names
    const requestData = {
      email: userData.email,
      password: userData.password,
      full_name: userData.fullName,
      phone: userData.phone || null,
      invitation_token: userData.invitationToken || undefined,
    };

    // Call backend registration endpoint
    const response = await apiClient.post('/auth/register', requestData);

    // Store token if registration returns one
    if (response.success && response.token) {
      await AsyncStorage.setItem('authToken', response.token);
    }

    // Return response with token and user data
    return response;
  } catch (error) {
    console.error('Registration error:', error);

    // Return full error response if available (includes validation details)
    if (error.response) {
      return error.response;
    }
    return {
      success: false,
      message: error.message || 'Registration failed. Please try again.',
    };
  }
};

// Login user
export const loginUser = async (email, password) => {
  try {
    // Call backend login endpoint
    const response = await apiClient.post('/auth/login', {
      email,
      password,
    });

    // Store token on successful login
    if (response.success && response.token) {
      await AsyncStorage.setItem('authToken', response.token);
    }

    // Return response with token and user data
    return response;
  } catch (error) {
    // Return full error response if available (includes validation details)
    if (error.response) {
      return error.response;
    }
    return {
      success: false,
      message: error.message || 'Login failed. Please try again.',
    };
  }
};

// Logout user - clear stored token
export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('authToken');
    return { success: true };
  } catch (error) {
    console.error('[Auth] Logout error:', error);
    return { success: false, message: 'Failed to logout' };
  }
};

// Check if user is authenticated
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    return !!token;
  } catch (error) {
    return false;
  }
};

// Get stored token
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('authToken');
  } catch (error) {
    return null;
  }
};