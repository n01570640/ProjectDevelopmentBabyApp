import * as profilePhotoModel from "../models/profile-photo.model";
import { uploadBufferToBlob, generateSasUrl } from "../utils/azure-blob.util";
import { ProfilePhotoResponseDTO } from "../dtos/profile-photo.dto";

/**
 * Return a fresh SAS URL for the user's saved profile photo.
 * Returns null if the user has no saved photo yet.
 */
export async function getProfilePhoto(userId: number): Promise<ProfilePhotoResponseDTO | null> {
  const row = await profilePhotoModel.findProfilePhotoByUserId(userId);
  if (!row) return null;
  // Generate a fresh 60-minute SAS URL from the stored blob name
  const sas_url = generateSasUrl(row.blob_url);
  return { user_id: row.user_id, sas_url };
}

/**
 * Upload the image buffer to Azure Blob Storage, persist the blob name in
 * profile_photos, then return a fresh SAS URL for immediate display.
 */
export async function uploadAndSaveProfilePhoto(
  userId: number,
  buffer: Buffer,
  mimeType: string
): Promise<ProfilePhotoResponseDTO> {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg":  "jpg",
    "image/png":  "png",
    "image/gif":  "gif",
    "image/webp": "webp",
  };
  const extension = extMap[mimeType] ?? "jpg";

  // uploadBufferToBlob now returns the blob NAME, not the direct URL
  const blobName = await uploadBufferToBlob(buffer, mimeType, extension, "profile-photos");

  // Persist the blob name in the DB (upsert)
  await profilePhotoModel.upsertProfilePhoto({ user_id: userId, blob_url: blobName });

  // Return a fresh SAS URL the frontend can use immediately
  const sas_url = generateSasUrl(blobName);
  return { user_id: userId, sas_url };
}
