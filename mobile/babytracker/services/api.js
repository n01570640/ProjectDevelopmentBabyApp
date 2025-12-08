// Simple HTTP client for API calls
const API_BASE_URL = 'http://192.168.2.37:3000/api/v1';

const apiClient = {
  async get(endpoint) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`GET ${endpoint} failed:`, error);
      throw error;
    }
  },

  async post(endpoint, data) {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        // Extract error message from backend response
        const errorMessage = responseBody.message || `API Error: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = responseBody;
        throw error;
      }

      return responseBody;
    } catch (error) {
      console.error(`POST ${endpoint} failed:`, error);
      throw error;
    }
  },
};

export default apiClient;
