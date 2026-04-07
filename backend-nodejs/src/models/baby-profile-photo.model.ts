import { getDb } from "../db";
import sql from "mssql";
import { BabyProfilePhotoDTO, UpsertBabyProfilePhotoDTO } from "../dtos/baby-profile-photo.dto";

/**
 * Get the profile photo row for a given baby.
 * Returns null if the baby has no saved photo yet.
 */
export async function findBabyProfilePhotoByBabyId(
  babyId: number
): Promise<BabyProfilePhotoDTO | null> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, babyId)
    .query(`SELECT baby_id, blob_url FROM baby_profile_photos WHERE baby_id = @baby_id`);
  return (result.recordset[0] as BabyProfilePhotoDTO) ?? null;
}

/**
 * Insert or update the profile photo URL for a baby.
 * Uses MERGE so the first upload creates the row and subsequent uploads replace it.
 */
export async function upsertBabyProfilePhoto(
  data: UpsertBabyProfilePhotoDTO
): Promise<BabyProfilePhotoDTO> {
  const db = await getDb();
  const result = await db
    .request()
    .input("baby_id", sql.BigInt, data.baby_id)
    .input("blob_url", sql.NVarChar(sql.MAX), data.blob_url)
    .query(`
      MERGE baby_profile_photos AS target
      USING (SELECT @baby_id AS baby_id, @blob_url AS blob_url) AS source
        ON target.baby_id = source.baby_id
      WHEN MATCHED THEN
        UPDATE SET blob_url = source.blob_url
      WHEN NOT MATCHED THEN
        INSERT (baby_id, blob_url) VALUES (source.baby_id, source.blob_url)
      OUTPUT INSERTED.baby_id, INSERTED.blob_url;
    `);
  return result.recordset[0] as BabyProfilePhotoDTO;
}

