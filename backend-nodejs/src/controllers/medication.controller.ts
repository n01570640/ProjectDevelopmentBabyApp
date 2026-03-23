import { Request, Response } from "express";
import * as medicationService from "../services/medication.service";
import { CreateMedicationDTO, UpdateMedicationDTO } from "../dtos/medication.dto";

/**
 * POST /api/v1/babies/:babyId/medications
 * Add a medication (requires can_edit_health)
 */
export async function createMedication(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const data: CreateMedicationDTO = {
      name: req.body.name,
      dosage: req.body.dosage,
      form: req.body.form,
      instructions: req.body.instructions,
      start_date: req.body.start_date,
      end_date: req.body.end_date,
      prescribed_by: req.body.prescribed_by,
    };

    const medication = await medicationService.createMedication(babyId, data);

    res.status(201).json({
      success: true,
      message: "Medication created successfully",
      data: medication,
    });
  } catch (error: any) {
    console.error("Error creating medication:", error);

    if (error.message.includes("End date cannot be before start date")) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create medication",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/medications
 * List medications for a baby
 */
export async function listMedications(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const medications = await medicationService.getBabyMedications(babyId);

    res.status(200).json({
      success: true,
      data: medications,
      total: medications.length,
    });
  } catch (error: any) {
    console.error("Error listing medications:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list medications",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/medications/:medicationId
 * Get a specific medication
 */
export async function getMedication(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const medicationId = parseInt(req.params.medicationId, 10);

    if (isNaN(babyId) || isNaN(medicationId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or medication ID" });
      return;
    }

    const belongsToBaby = await medicationService.medicationBelongsToBaby(medicationId, babyId);
    if (!belongsToBaby) {
      res.status(404).json({ success: false, message: "Medication not found" });
      return;
    }

    const medication = await medicationService.getMedication(medicationId);
    if (!medication) {
      res.status(404).json({ success: false, message: "Medication not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: medication,
    });
  } catch (error: any) {
    console.error("Error getting medication:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get medication",
    });
  }
}

/**
 * PUT /api/v1/babies/:babyId/medications/:medicationId
 * Update a medication (requires can_edit_health)
 */
export async function updateMedication(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const medicationId = parseInt(req.params.medicationId, 10);

    if (isNaN(babyId) || isNaN(medicationId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or medication ID" });
      return;
    }

    const belongsToBaby = await medicationService.medicationBelongsToBaby(medicationId, babyId);
    if (!belongsToBaby) {
      res.status(404).json({ success: false, message: "Medication not found" });
      return;
    }

    const data: UpdateMedicationDTO = {};
    if (req.body.name !== undefined) data.name = req.body.name;
    if (req.body.dosage !== undefined) data.dosage = req.body.dosage;
    if (req.body.form !== undefined) data.form = req.body.form;
    if (req.body.instructions !== undefined) data.instructions = req.body.instructions;
    if (req.body.start_date !== undefined) data.start_date = req.body.start_date;
    if (req.body.end_date !== undefined) data.end_date = req.body.end_date;
    if (req.body.prescribed_by !== undefined) data.prescribed_by = req.body.prescribed_by;

    const medication = await medicationService.updateMedication(medicationId, data);

    if (!medication) {
      res.status(404).json({ success: false, message: "Medication not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Medication updated successfully",
      data: medication,
    });
  } catch (error: any) {
    console.error("Error updating medication:", error);

    if (error.message.includes("End date cannot be before start date")) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update medication",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/medications/:medicationId
 * Delete a medication (requires can_edit_health)
 */
export async function deleteMedication(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const medicationId = parseInt(req.params.medicationId, 10);

    if (isNaN(babyId) || isNaN(medicationId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or medication ID" });
      return;
    }

    const belongsToBaby = await medicationService.medicationBelongsToBaby(medicationId, babyId);
    if (!belongsToBaby) {
      res.status(404).json({ success: false, message: "Medication not found" });
      return;
    }

    const deleted = await medicationService.deleteMedication(medicationId);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Medication not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Medication deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting medication:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medication",
    });
  }
}
