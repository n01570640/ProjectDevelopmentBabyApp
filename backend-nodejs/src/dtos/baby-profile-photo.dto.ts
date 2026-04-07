export interface BabyProfilePhotoDTO {
  baby_id: number;
  blob_url: string; // blob name stored in DB, e.g. "baby-profile-photos/uuid.jpg"
}

export interface UpsertBabyProfilePhotoDTO {
  baby_id: number;
  blob_url: string;
}

// Returned to the frontend — includes a fresh SAS URL for display
export interface BabyProfilePhotoResponseDTO {
  baby_id: number;
  sas_url: string;
}

