import * as babyProfilePhotoModel from "../models/baby-profile-photo.model";
import { uploadBufferToBlob, generateSasUrl } from "../utils/azure-blob.util";
import { BabyProfilePhotoResponseDTO } from "../dtos/baby-profile-photo.dto";

/**
 * Return a fresh SAS URL for the baby's saved profile photo.
 * Returns null if the baby has no saved photo yet.
 */
export async function getBabyProfilePhoto(
  babyId: number
): Promise<BabyProfilePhotoResponseDTO | null> {
  const row = await babyProfilePhotoModel.findBabyProfilePhotoByBabyId(babyId);
  if (!row) return null;
  const sas_url = generateSasUrl(row.blob_url);
  return { baby_id: row.baby_id, sas_url };
}

/**
 * Upload the image buffer to Azure Blob Storage, persist the blob name in
 * baby_profile_photos, then return a fresh SAS URL for immediate display.
 */
export async function uploadAndSaveBabyProfilePhoto(
  babyId: number,
  buffer: Buffer,
  mimeType: string
): Promise<BabyProfilePhotoResponseDTO> {
  const extMap: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/jpg":  "jpg",
    "image/png":  "png",
    "image/gif":  "gif",
    "image/webp": "webp",
  };
  const extension = extMap[mimeType] ?? "jpg";

  const blobName = await uploadBufferToBlob(buffer, mimeType, extension, "baby-profile-photos");

  await babyProfilePhotoModel.upsertBabyProfilePhoto({ baby_id: babyId, blob_url: blobName });

  const sas_url = generateSasUrl(blobName);
  return { baby_id: babyId, sas_url };
}

