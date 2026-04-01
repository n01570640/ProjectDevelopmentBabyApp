import { getDb } from "../db";
import sql from "mssql";
import { ProfilePhotoDTO, UpsertProfilePhotoDTO } from "../dtos/profile-photo.dto";

/**
 * Get the profile photo row for a given user.
 * Returns null if the user has no saved photo yet.
 */
export async function findProfilePhotoByUserId(
  userId: number
): Promise<ProfilePhotoDTO | null> {
  const db = await getDb();
  const result = await db
    .request()
    .input("user_id", sql.BigInt, userId)
    .query(`SELECT user_id, blob_url FROM profile_photos WHERE user_id = @user_id`);
  return (result.recordset[0] as ProfilePhotoDTO) ?? null;
}

/**
 * Insert or update the profile photo URL for a user.
 * Uses MERGE so the first upload creates the row and subsequent uploads replace it.
 */
export async function upsertProfilePhoto(
  data: UpsertProfilePhotoDTO
): Promise<ProfilePhotoDTO> {
  const db = await getDb();
  const result = await db
    .request()
    .input("user_id", sql.BigInt, data.user_id)
    .input("blob_url", sql.NVarChar(2048), data.blob_url)
    .query(`
      MERGE profile_photos AS target
      USING (SELECT @user_id AS user_id, @blob_url AS blob_url) AS source
        ON target.user_id = source.user_id
      WHEN MATCHED THEN
        UPDATE SET blob_url = source.blob_url
      WHEN NOT MATCHED THEN
        INSERT (user_id, blob_url) VALUES (source.user_id, source.blob_url)
      OUTPUT INSERTED.user_id, INSERTED.blob_url;
    `);
  return result.recordset[0] as ProfilePhotoDTO;
}

