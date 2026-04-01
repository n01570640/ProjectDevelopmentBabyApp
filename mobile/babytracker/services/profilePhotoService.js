import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import Constants from "expo-constants";

// ---------- same base-URL logic as api.js ----------
const LOCAL_IPV4 = "192.168.68.50";

const getApiBaseUrl = () => {
  if (Platform.OS === "android") {
    if (Constants.isDevice === true) return `http://${LOCAL_IPV4}:3000/api/v1`;
    return "http://10.0.2.2:3000/api/v1";
  } else if (Platform.OS === "ios") {
    return `http://${LOCAL_IPV4}:3000/api/v1`;
  }
  return "http://localhost:3000/api/v1";
};

const API_BASE_URL = getApiBaseUrl();

// ─────────────────────────────────────────────────────────
// Get the saved profile photo for the authenticated user.
// Returns { success: true, data: { user_id, blob_url } }
// or      { success: false, message }
// ─────────────────────────────────────────────────────────
export const getProfilePhoto = async () => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/users/me/profile-photo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    const body = await response.json();
    if (!response.ok) {
      // 404 is expected when the user has no photo yet — treat as success with null data
      if (response.status === 404) return { success: true, data: null };
      return { success: false, message: body.message || `API Error: ${response.status}` };
    }
    return body; // { success: true, data: { user_id, sas_url } }
  } catch (error) {
    console.error("[profilePhotoService] getProfilePhoto error:", error);
    return { success: false, message: error.message || "Failed to fetch profile photo" };
  }
};

// ─────────────────────────────────────────────────────────
// Upload a new profile photo.
// imageUri: local file URI returned by expo-image-picker (e.g. "file:///...")
// Returns { success: true, data: { user_id, blob_url } }
// or      { success: false, message }
// ─────────────────────────────────────────────────────────
export const uploadProfilePhoto = async (imageUri) => {
  try {
    const token = await AsyncStorage.getItem("authToken");

    // Strip query strings and derive extension from the clean path
    const cleanUri = imageUri.split("?")[0];
    const uriParts = cleanUri.split(".");
    const rawExt = uriParts[uriParts.length - 1]?.toLowerCase() ?? "jpg";
    // Remove any non-alpha chars that may have crept in (e.g. from blob: URIs)
    const extension = rawExt.replace(/[^a-z]/g, "") || "jpg";
    const mimeTypeMap = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mimeType = mimeTypeMap[extension] ?? "image/jpeg";

    const formData = new FormData();

    if (Platform.OS === "web") {
      // On web, ImagePicker returns a blob: URI.
      // We must fetch it and convert to a real Blob before appending to FormData,
      // otherwise the browser sends it as a plain text field instead of a file part.
      const blobResponse = await fetch(imageUri);
      const blob = await blobResponse.blob();
      formData.append("photo", blob, `profile.${extension}`);
    } else {
      // On iOS / Android, use the React Native { uri, name, type } object.
      formData.append("photo", {
        uri: imageUri,
        name: `profile.${extension}`,
        type: mimeType,
      });
    }

    // Use XMLHttpRequest — reliable for multipart across React Native, Expo Go, and web
    return await new Promise((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/users/me/profile-photo`);

      if (token) {
        xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      }
      // Do NOT set Content-Type manually — let XHR add the correct boundary

      xhr.onload = () => {
        try {
          const body = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(body);
          } else {
            resolve({ success: false, message: body.message || `Upload failed: ${xhr.status}` });
          }
        } catch {
          resolve({ success: false, message: `Upload failed: ${xhr.status}` });
        }
      };

      xhr.onerror = () => {
        resolve({ success: false, message: "Network error during upload" });
      };

      xhr.send(formData);
    });
  } catch (error) {
    console.error("[profilePhotoService] uploadProfilePhoto error:", error);
    return { success: false, message: error.message || "Failed to upload profile photo" };
  }
};

