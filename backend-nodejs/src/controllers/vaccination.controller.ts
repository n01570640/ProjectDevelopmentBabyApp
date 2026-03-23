import { Request, Response } from "express";
import * as vaccinationService from "../services/vaccination.service";
import { CreateVaccinationDTO, UpdateVaccinationDTO } from "../dtos/vaccination.dto";

/**
 * POST /api/v1/babies/:babyId/vaccinations
 * Record a vaccination (requires can_edit_health permission)
 */
export async function createVaccination(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const data: CreateVaccinationDTO = {
      vaccine_id: req.body.vaccine_id,
      administered_on: req.body.administered_on,
      clinic: req.body.clinic,
      lot_number: req.body.lot_number,
      administered_by: req.body.administered_by,
    };

    const vaccination = await vaccinationService.createVaccination(
      babyId,
      userId,
      data
    );

    res.status(201).json({
      success: true,
      message: "Vaccination recorded successfully",
      data: vaccination,
    });
  } catch (error: any) {
    console.error("Error creating vaccination:", error);

    if (error.message === "Invalid vaccine ID") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to record vaccination",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/vaccinations
 * List all vaccinations for a baby (requires baby access)
 */
export async function listVaccinations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const vaccinations = await vaccinationService.getBabyVaccinations(babyId);

    res.status(200).json({
      success: true,
      data: {
        vaccinations,
        total: vaccinations.length,
      },
    });
  } catch (error: any) {
    console.error("Error listing vaccinations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list vaccinations",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/vaccinations/:vaccinationId
 * Get vaccination details (requires baby access)
 */
export async function getVaccination(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const vaccinationId = parseInt(req.params.vaccinationId, 10);

    if (isNaN(babyId) || isNaN(vaccinationId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or vaccination ID" });
      return;
    }

    // Verify vaccination belongs to baby
    const belongsToBaby = await vaccinationService.vaccinationBelongsToBaby(
      vaccinationId,
      babyId
    );

    if (!belongsToBaby) {
      res.status(404).json({
        success: false,
        message: "Vaccination not found",
      });
      return;
    }

    const vaccination = await vaccinationService.getVaccination(vaccinationId);

    if (!vaccination) {
      res.status(404).json({
        success: false,
        message: "Vaccination not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: vaccination,
    });
  } catch (error: any) {
    console.error("Error getting vaccination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get vaccination",
    });
  }
}

/**
 * PUT /api/v1/babies/:babyId/vaccinations/:vaccinationId
 * Update vaccination record (requires can_edit_health permission)
 */
export async function updateVaccination(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const vaccinationId = parseInt(req.params.vaccinationId, 10);

    if (isNaN(babyId) || isNaN(vaccinationId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or vaccination ID" });
      return;
    }

    // Verify vaccination belongs to baby
    const belongsToBaby = await vaccinationService.vaccinationBelongsToBaby(
      vaccinationId,
      babyId
    );

    if (!belongsToBaby) {
      res.status(404).json({
        success: false,
        message: "Vaccination not found",
      });
      return;
    }

    const data: UpdateVaccinationDTO = {};
    if (req.body.vaccine_id !== undefined) data.vaccine_id = req.body.vaccine_id;
    if (req.body.administered_on !== undefined) data.administered_on = req.body.administered_on;
    if (req.body.clinic !== undefined) data.clinic = req.body.clinic;
    if (req.body.lot_number !== undefined) data.lot_number = req.body.lot_number;
    if (req.body.administered_by !== undefined) data.administered_by = req.body.administered_by;

    const vaccination = await vaccinationService.updateVaccination(
      vaccinationId,
      data
    );

    if (!vaccination) {
      res.status(404).json({
        success: false,
        message: "Vaccination not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vaccination updated successfully",
      data: vaccination,
    });
  } catch (error: any) {
    console.error("Error updating vaccination:", error);

    if (error.message === "Invalid vaccine ID") {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update vaccination",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/vaccinations/:vaccinationId
 * Delete vaccination record (requires can_edit_health permission)
 */
export async function deleteVaccination(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const vaccinationId = parseInt(req.params.vaccinationId, 10);

    if (isNaN(babyId) || isNaN(vaccinationId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or vaccination ID" });
      return;
    }

    // Verify vaccination belongs to baby
    const belongsToBaby = await vaccinationService.vaccinationBelongsToBaby(
      vaccinationId,
      babyId
    );

    if (!belongsToBaby) {
      res.status(404).json({
        success: false,
        message: "Vaccination not found",
      });
      return;
    }

    const deleted = await vaccinationService.deleteVaccination(vaccinationId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Vaccination not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Vaccination deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting vaccination:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete vaccination",
    });
  }
}
