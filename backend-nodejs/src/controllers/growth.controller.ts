import { Request, Response } from "express";
import * as growthService from "../services/growth.service";
import { CreateGrowthDTO, UpdateGrowthDTO } from "../dtos/growth.dto";

/**
 * POST /api/v1/babies/:babyId/growth
 * Record growth metrics (requires can_edit_health permission)
 */
export async function createGrowth(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const data: CreateGrowthDTO = {
      weight_kg: req.body.weight_kg,
      length_cm: req.body.length_cm,
      head_circum_cm: req.body.head_circum_cm,
      notes: req.body.notes,
      recorded_at: req.body.recorded_at,
    };

    const growth = await growthService.createGrowth(babyId, userId, data);

    res.status(201).json({
      success: true,
      message: "Growth record created successfully",
      data: growth,
    });
  } catch (error: any) {
    console.error("Error creating growth record:", error);

    if (error.message.includes("At least one measurement")) {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to record growth metrics",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/growth
 * List all growth records for a baby (requires baby access)
 */
export async function listGrowth(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    const growthRecords = await growthService.getBabyGrowthHistory(babyId);

    res.status(200).json({
      success: true,
      data: growthRecords,
      total: growthRecords.length,
    });
  } catch (error: any) {
    console.error("Error listing growth records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list growth records",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/growth/latest
 * Get latest growth record for a baby (requires baby access)
 */
export async function getLatestGrowth(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    const latestGrowth = await growthService.getLatestGrowth(babyId);

    res.status(200).json({
      success: true,
      data: latestGrowth,
    });
  } catch (error: any) {
    console.error("Error getting latest growth:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get latest growth",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/growth/:growthId
 * Get growth record details (requires baby access)
 */
export async function getGrowth(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const growthId = parseInt(req.params.growthId, 10);

    // Verify growth record belongs to baby
    const belongsToBaby = await growthService.growthBelongsToBaby(growthId, babyId);

    if (!belongsToBaby) {
      res.status(404).json({
        success: false,
        message: "Growth record not found",
      });
      return;
    }

    const growth = await growthService.getGrowth(growthId);

    if (!growth) {
      res.status(404).json({
        success: false,
        message: "Growth record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: growth,
    });
  } catch (error: any) {
    console.error("Error getting growth record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get growth record",
    });
  }
}

/**
 * PUT /api/v1/babies/:babyId/growth/:growthId
 * Update growth record (requires can_edit_health permission)
 */
export async function updateGrowth(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const growthId = parseInt(req.params.growthId, 10);

    // Verify growth record belongs to baby
    const belongsToBaby = await growthService.growthBelongsToBaby(growthId, babyId);

    if (!belongsToBaby) {
      res.status(404).json({
        success: false,
        message: "Growth record not found",
      });
      return;
    }

    const data: UpdateGrowthDTO = {};
    if (req.body.weight_kg !== undefined) data.weight_kg = req.body.weight_kg;
    if (req.body.length_cm !== undefined) data.length_cm = req.body.length_cm;
    if (req.body.head_circum_cm !== undefined) data.head_circum_cm = req.body.head_circum_cm;
    if (req.body.notes !== undefined) data.notes = req.body.notes;
    if (req.body.recorded_at !== undefined) data.recorded_at = req.body.recorded_at;

    const growth = await growthService.updateGrowth(growthId, data);

    if (!growth) {
      res.status(404).json({
        success: false,
        message: "Growth record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Growth record updated successfully",
      data: growth,
    });
  } catch (error: any) {
    console.error("Error updating growth record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update growth record",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/growth/:growthId
 * Delete growth record (requires can_edit_health permission)
 */
export async function deleteGrowth(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const growthId = parseInt(req.params.growthId, 10);

    // Verify growth record belongs to baby
    const belongsToBaby = await growthService.growthBelongsToBaby(growthId, babyId);

    if (!belongsToBaby) {
      res.status(404).json({
        success: false,
        message: "Growth record not found",
      });
      return;
    }

    const deleted = await growthService.deleteGrowth(growthId);

    if (!deleted) {
      res.status(404).json({
        success: false,
        message: "Growth record not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Growth record deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting growth record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete growth record",
    });
  }
}
