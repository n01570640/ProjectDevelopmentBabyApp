import apiClient from './api';

// Register a new user
export const registerUser = async (userData) => {
  try {
    // Map frontend field names to backend field names
    const requestData = {
      email: userData.email,
      password: userData.password,
      full_name: userData.fullName,
      phone: userData.phone || null, // Send null instead of undefined
    };

    console.log('Sending registration data:', requestData);

    // Call backend registration endpoint
    const response = await apiClient.post('/auth/register', requestData);

    console.log('Registration response:', response);

    // Return response with token and user data
    return response;
  } catch (error) {
    console.error('Registration error:', error);

    // Return error response with more details
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

    // Return response with token and user data
    return response;
  } catch (error) {
    // Return error response
    return {
      success: false,
      message: error.message || 'Login failed. Please try again.',
    };
  }
};