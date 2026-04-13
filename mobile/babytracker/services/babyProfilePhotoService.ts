import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { API_BASE_URL } from "./api";

// ─────────────────────────────────────────────────────────
// Get the saved profile photo for a baby.
// Returns { success: true, data: { baby_id, sas_url } }
// or      { success: true, data: null }  — when no photo saved yet
// or      { success: false, message }
// ─────────────────────────────────────────────────────────
export const getBabyProfilePhoto = async (babyId: number) => {
  try {
    const token = await AsyncStorage.getItem("authToken");
    const response = await fetch(`${API_BASE_URL}/babies/${babyId}/profile-photo`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
    // 404 is expected when the baby has no photo yet — treat as success with null
    if (response.status === 404) return { success: true, data: null };
    const body = await response.json();
    if (!response.ok) {
      return { success: false, message: body.message || `API Error: ${response.status}` };
    }
    return body; // { success: true, data: { baby_id, sas_url } }
  } catch (error: any) {
    console.error("[babyProfilePhotoService] getBabyProfilePhoto error:", error);
    return { success: false, message: error.message || "Failed to fetch baby profile photo" };
  }
};

// ─────────────────────────────────────────────────────────
// Upload a new profile photo for a baby.
// imageUri: local file URI returned by expo-image-picker
// Returns { success: true, data: { baby_id, sas_url } }
// or      { success: false, message }
// ─────────────────────────────────────────────────────────
export const uploadBabyProfilePhoto = async (babyId: number, imageUri: string) => {
  try {
    const token = await AsyncStorage.getItem("authToken");

    const cleanUri = imageUri.split("?")[0];
    const uriParts = cleanUri.split(".");
    const rawExt = uriParts[uriParts.length - 1]?.toLowerCase() ?? "jpg";
    const extension = rawExt.replace(/[^a-z]/g, "") || "jpg";
    const mimeTypeMap: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      webp: "image/webp",
    };
    const mimeType = mimeTypeMap[extension] ?? "image/jpeg";

    const formData = new FormData();

    if (Platform.OS === "web") {
      // Web: fetch blob URI and convert to real Blob
      const blobResponse = await fetch(imageUri);
      const blob = await blobResponse.blob();
      (formData as any).append("photo", blob, `profile.${extension}`);
    } else {
      // iOS / Android: use the RN { uri, name, type } object
      (formData as any).append("photo", {
        uri: imageUri,
        name: `profile.${extension}`,
        type: mimeType,
      });
    }

    // Use XHR so multipart boundary is handled correctly across all platforms
    return await new Promise<any>((resolve) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", `${API_BASE_URL}/babies/${babyId}/profile-photo`);

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
  } catch (error: any) {
    console.error("[babyProfilePhotoService] uploadBabyProfilePhoto error:", error);
    return { success: false, message: error.message || "Failed to upload baby profile photo" };
  }
};

