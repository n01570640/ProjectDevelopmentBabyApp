import { Request, Response } from "express";
import * as symptomService from "../services/symptom.service";
import { CreateSymptomLogDTO, UpdateSymptomLogDTO } from "../dtos/symptom.dto";

/**
 * GET /api/v1/symptoms
 * List all symptoms from DB catalog
 */
export async function listSymptoms(req: Request, res: Response): Promise<void> {
  try {
    const symptoms = await symptomService.listSymptoms();
    res.status(200).json({
      success: true,
      data: symptoms,
    });
  } catch (error: any) {
    console.error("Error listing symptoms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list symptoms",
    });
  }
}

/**
 * GET /api/v1/symptoms/:code
 * Get a single symptom by code
 */
export async function getSymptom(req: Request, res: Response): Promise<void> {
  try {
    const code = req.params.code?.toUpperCase();
    const symptom = await symptomService.getSymptomByCode(code);

    if (!symptom) {
      res.status(404).json({
        success: false,
        message: "Symptom not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: symptom,
    });
  } catch (error: any) {
    console.error("Error getting symptom:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get symptom",
    });
  }
}

/**
 * POST /api/v1/babies/:babyId/symptoms
 * Log a symptom (requires can_edit_health)
 */
export async function createSymptomLog(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const data: CreateSymptomLogDTO = {
      symptom_code: req.body.symptom_code,
      started_at: req.body.started_at,
      severity_1_5: req.body.severity_1_5,
      trigger_note: req.body.trigger_note,
      associated_med_id: req.body.associated_med_id,
      notes: req.body.notes,
    };

    const symptomLog = await symptomService.createSymptomLog(babyId, userId, data);

    res.status(201).json({
      success: true,
      message: "Symptom log created successfully",
      data: symptomLog,
    });
  } catch (error: any) {
    console.error("Error creating symptom log:", error);

    if (
      error.message.includes("Invalid symptom code") ||
      error.message.includes("Severity must be")
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create symptom log",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/symptoms
 * List symptom logs for a baby with optional filters
 */
export async function listSymptomLogs(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const filters = {
      from: req.query.from as string | undefined,
      to: req.query.to as string | undefined,
      symptom_code: req.query.symptom_code as string | undefined,
    };

    const logs = await symptomService.getBabySymptomLogs(babyId, filters);

    res.status(200).json({
      success: true,
      data: logs,
      total: logs.length,
    });
  } catch (error: any) {
    console.error("Error listing symptom logs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list symptom logs",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/symptoms/:symptomLogId
 * Get a specific symptom log
 */
export async function getSymptomLog(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const symptomLogId = parseInt(req.params.symptomLogId, 10);

    if (isNaN(babyId) || isNaN(symptomLogId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or symptom log ID" });
      return;
    }

    await symptomService.assertSymptomLogBelongsToBaby(symptomLogId, babyId);

    const log = await symptomService.getSymptomLog(symptomLogId);
    if (!log) {
      res.status(404).json({ success: false, message: "Symptom log not found" });
      return;
    }

    res.status(200).json({
      success: true,
      data: log,
    });
  } catch (error: any) {
    console.error("Error getting symptom log:", error);

    if (error.message?.includes("not found")) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to get symptom log",
    });
  }
}

/**
 * PUT /api/v1/babies/:babyId/symptoms/:symptomLogId
 * Update a symptom log (requires can_edit_health)
 */
export async function updateSymptomLog(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const symptomLogId = parseInt(req.params.symptomLogId, 10);

    if (isNaN(babyId) || isNaN(symptomLogId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or symptom log ID" });
      return;
    }

    await symptomService.assertSymptomLogBelongsToBaby(symptomLogId, babyId);

    const data: UpdateSymptomLogDTO = {};
    if (req.body.symptom_code !== undefined) data.symptom_code = req.body.symptom_code;
    if (req.body.started_at !== undefined) data.started_at = req.body.started_at;
    if (req.body.severity_1_5 !== undefined) data.severity_1_5 = req.body.severity_1_5;
    if (req.body.trigger_note !== undefined) data.trigger_note = req.body.trigger_note;
    if (req.body.associated_med_id !== undefined) data.associated_med_id = req.body.associated_med_id;
    if (req.body.notes !== undefined) data.notes = req.body.notes;

    const log = await symptomService.updateSymptomLog(symptomLogId, data);

    if (!log) {
      res.status(404).json({ success: false, message: "Symptom log not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Symptom log updated successfully",
      data: log,
    });
  } catch (error: any) {
    console.error("Error updating symptom log:", error);

    if (error.message?.includes("not found")) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    if (
      error.message?.includes("Invalid symptom code") ||
      error.message?.includes("Severity must be")
    ) {
      res.status(400).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to update symptom log",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/symptoms/:symptomLogId
 * Delete a symptom log (requires can_edit_health)
 */
export async function deleteSymptomLog(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const symptomLogId = parseInt(req.params.symptomLogId, 10);

    if (isNaN(babyId) || isNaN(symptomLogId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID or symptom log ID" });
      return;
    }

    await symptomService.assertSymptomLogBelongsToBaby(symptomLogId, babyId);

    const deleted = await symptomService.deleteSymptomLog(symptomLogId);
    if (!deleted) {
      res.status(404).json({ success: false, message: "Symptom log not found" });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Symptom log deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting symptom log:", error);

    if (error.message?.includes("not found")) {
      res.status(404).json({ success: false, message: error.message });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to delete symptom log",
    });
  }
}
