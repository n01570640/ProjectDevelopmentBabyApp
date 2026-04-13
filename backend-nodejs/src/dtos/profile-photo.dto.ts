export interface ProfilePhotoDTO {
  user_id: number;
  blob_url: string; // blob name stored in DB, e.g. "profile-photos/uuid.jpg"
}

export interface UpsertProfilePhotoDTO {
  user_id: number;
  blob_url: string;
}

// Returned to the frontend — includes a fresh SAS URL for display
export interface ProfilePhotoResponseDTO {
  user_id: number;
  sas_url: string;
}
