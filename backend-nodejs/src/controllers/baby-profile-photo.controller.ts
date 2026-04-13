import { Request, Response } from "express";
import * as babyProfilePhotoService from "../services/baby-profile-photo.service";

/**
 * GET /api/v1/babies/:babyId/profile-photo
 * Returns a fresh SAS URL for the baby's profile photo.
 * Returns 404 if no photo has been uploaded yet.
 */
export async function getBabyProfilePhoto(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    if (!babyId || isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Valid baby ID is required" });
      return;
    }

    const photo = await babyProfilePhotoService.getBabyProfilePhoto(babyId);

    if (!photo) {
      res.status(404).json({ success: false, message: "No profile photo found for this baby" });
      return;
    }

    res.status(200).json({ success: true, data: photo });
  } catch (error: any) {
    console.error("Error fetching baby profile photo:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to fetch baby profile photo", detail: error?.message });
  }
}

/**
 * POST /api/v1/babies/:babyId/profile-photo
 * Accepts multipart/form-data with field "photo".
 * Uploads to Azure Blob (private container) and returns a SAS URL for display.
 */
export async function uploadBabyProfilePhoto(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    if (!babyId || isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Valid baby ID is required" });
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

    const photo = await babyProfilePhotoService.uploadAndSaveBabyProfilePhoto(
      babyId,
      file.buffer,
      file.mimetype
    );

    res.status(200).json({
      success: true,
      message: "Baby profile photo uploaded successfully",
      data: photo, // { baby_id, sas_url }
    });
  } catch (error: any) {
    console.error("Error uploading baby profile photo:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to upload baby profile photo", detail: error?.message });
  }
}

