import { Platform } from "react-native";
import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

// =========================================================
// PLATFORM + ENVIRONMENT AUTO-DETECTION
// =========================================================

// Your machine's IPv4 (for physical devices on same WiFi)
const LOCAL_IPV4 = "10.0.0.232";

// Determine which BASE URL to use
const getApiBaseUrl = () => {
  if (Platform.OS === "android") {
    // Android emulator: isDevice is false or undefined in some Expo versions
    // Physical device: isDevice is true
    if (Constants.isDevice === true) {
      // Physical Android device - use local IP
      return `http://${LOCAL_IPV4}:3000/api/v1`;
    }
    // Android Emulator - use special IP that maps to host localhost
    return "http://10.0.2.2:3000/api/v1";
  } else if (Platform.OS === "ios") {
    // iOS simulator or device - use local IP
    return `http://${LOCAL_IPV4}:3000/api/v1`;
  }
  // Web fallback
  return "http://localhost:3000/api/v1";
};

export const API_BASE_URL = getApiBaseUrl();


// =========================================================
// HTTP CLIENT
// =========================================================

const apiClient = {
  // Get auth headers with JWT token from storage
  async getAuthHeaders() {
    try {
      const token = await AsyncStorage.getItem("authToken");
      return token ? { Authorization: `Bearer ${token}` } : {};
    } catch (error) {
      return {};
    }
  },

  async get(endpoint) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] GET ${url}`);
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      if (!response.ok) {
        const responseBody = await response.json().catch(() => ({}));
        const errorMessage = responseBody.message || `API Error: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = responseBody;
        throw error;
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  },

  async post(endpoint, data) {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`[API] POST ${url}`);
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        // Extract error message from backend response
        const errorMessage =
          responseBody.message || `API Error: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = responseBody;
        throw error;
      }

      return responseBody;
    } catch (error) {
      throw error;
    }
  },

  async put(endpoint, data) {
    console.log(`[API] PUT ${API_BASE_URL}${endpoint}`);
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
        body: JSON.stringify(data),
      });

      const responseBody = await response.json();

      if (!response.ok) {
        const errorMessage = responseBody.message || `API Error: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = responseBody;
        throw error;
      }

      return responseBody;
    } catch (error) {
      throw error;
    }
  },

  async delete(endpoint) {
    console.log(`[API] DELETE ${API_BASE_URL}${endpoint}`);
    try {
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders,
        },
      });

      const responseBody = await response.json();

      if (!response.ok) {
        const errorMessage = responseBody.message || `API Error: ${response.status}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.response = responseBody;
        throw error;
      }

      return responseBody;
    } catch (error) {
      throw error;
    }
  },
};

export default apiClient;
