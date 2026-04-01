import { Request, Response } from "express";
import * as profilePhotoService from "../services/profile-photo.service";

/**
 * GET /api/v1/users/me/profile-photo
 * Returns a fresh SAS URL for the authenticated user's profile photo.
 * Returns 404 if no photo has been uploaded yet.
 */
export async function getProfilePhoto(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const photo = await profilePhotoService.getProfilePhoto(userId);

    if (!photo) {
      res.status(404).json({ success: false, message: "No profile photo found" });
      return;
    }

    res.status(200).json({ success: true, data: photo });
  } catch (error: any) {
    console.error("Error fetching profile photo:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to fetch profile photo", detail: error?.message });
  }
}

/**
 * POST /api/v1/users/me/profile-photo
 * Accepts multipart/form-data with field "photo".
 * Uploads to Azure Blob (private container) and returns a SAS URL for display.
 */
export async function uploadProfilePhoto(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const file = req.file;
    if (!file) {
      res.status(400).json({ success: false, message: "No image file provided. Send a multipart/form-data request with field name 'photo'" });
      return;
    }

    const allowedMimeTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      res.status(400).json({ success: false, message: "Invalid file type. Allowed: jpeg, png, webp, gif" });
      return;
    }

    const photo = await profilePhotoService.uploadAndSaveProfilePhoto(
      userId,
      file.buffer,
      file.mimetype
    );

    res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: photo, // { user_id, sas_url }
    });
  } catch (error: any) {
    console.error("Error uploading profile photo:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to upload profile photo", detail: error?.message });
  }
}
