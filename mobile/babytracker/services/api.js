import { Platform } from "react-native";
import Constants from "expo-constants";

// =========================================================
// PLATFORM + ENVIRONMENT AUTO-DETECTION
// =========================================================

// Detect Android Emulator (Maps to host machine's localhost)
const isAndroidEmulator =
  Platform.OS === "android" && Constants.isDevice === false;

// Hardcode your machine's IPv4 for iOS simulator + devices
const LOCAL_IPV4 = "192.168.14.184";

// Determine which BASE URL to use
const API_BASE_URL = isAndroidEmulator
  ? "http://10.0.2.2:3000/api/v1"                 // Android Emulator
  : Platform.OS === "ios"
  ? `http://${LOCAL_IPV4}:3000/api/v1`            // iOS Simulator + devices
  : "http://localhost:3000/api/v1";               // Web fallback

console.log("📡 Using API Base URL:", API_BASE_URL);

// =========================================================
// HTTP CLIENT
// =========================================================

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
