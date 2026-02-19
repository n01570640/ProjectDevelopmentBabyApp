import { Request, Response } from "express";
import * as activityService from "../services/activity.service";
import { CreateActivityDTO, UpdateActivityDTO } from "../dtos/activity.dto";

/**
 * POST /api/v1/babies/:babyId/activities
 */
export async function createActivity(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const data: CreateActivityDTO = {
      baby_id:       babyId,
      activity_type: req.body.activity_type,
      start_time:    new Date(req.body.start_time),
      end_time:      req.body.end_time   ? new Date(req.body.end_time)   : null,
      amount:        req.body.amount     ?? null,
      unit:          req.body.unit       ?? null,
      diaper_type:   req.body.diaper_type ?? null,
      side:          req.body.side       ?? null,
      quality:       req.body.quality    ?? null,
      notes:         req.body.notes      ?? null,
      recorded_by:   userId,
    };

    const activity = await activityService.createActivity(data);

    res.status(201).json({ success: true, message: "Activity created successfully", data: activity });
  } catch (error: any) {
    console.error("Error creating activity:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to create activity", detail: error?.message });
  }
}

/**
 * GET /api/v1/babies/:babyId/activities
 */
export async function listActivities(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const activities = await activityService.getBabyActivities(babyId);
    res.status(200).json({ success: true, data: activities, total: activities.length });
  } catch (error: any) {
    console.error("Error listing activities:", error);
    res.status(500).json({ success: false, message: "Failed to list activities" });
  }
}

/**
 * GET /api/v1/babies/:babyId/activities/:activityId
 */
export async function getActivity(req: Request, res: Response): Promise<void> {
  try {
    const activityId = parseInt(req.params.activityId, 10);
    const activity = await activityService.getActivity(activityId);

    if (!activity) {
      res.status(404).json({ success: false, message: "Activity not found" });
      return;
    }
    res.status(200).json({ success: true, data: activity });
  } catch (error: any) {
    console.error("Error getting activity:", error);
    res.status(500).json({ success: false, message: "Failed to get activity" });
  }
}

/**
 * PUT /api/v1/babies/:babyId/activities/:activityId
 */
export async function updateActivity(req: Request, res: Response): Promise<void> {
  try {
    const activityId = parseInt(req.params.activityId, 10);

    const data: UpdateActivityDTO = {};
    if (req.body.activity_type !== undefined) data.activity_type = req.body.activity_type;
    if (req.body.start_time    !== undefined) data.start_time    = new Date(req.body.start_time);
    if (req.body.end_time      !== undefined) data.end_time      = req.body.end_time ? new Date(req.body.end_time) : null;
    if (req.body.amount        !== undefined) data.amount        = req.body.amount;
    if (req.body.unit          !== undefined) data.unit          = req.body.unit;
    if (req.body.diaper_type   !== undefined) data.diaper_type   = req.body.diaper_type;
    if (req.body.side          !== undefined) data.side          = req.body.side;
    if (req.body.quality       !== undefined) data.quality       = req.body.quality;
    if (req.body.notes         !== undefined) data.notes         = req.body.notes;

    const activity = await activityService.updateActivity(activityId, data);

    if (!activity) {
      res.status(404).json({ success: false, message: "Activity not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Activity updated successfully", data: activity });
  } catch (error: any) {
    console.error("Error updating activity:", error);
    res.status(500).json({ success: false, message: "Failed to update activity" });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/activities/:activityId
 */
export async function deleteActivity(req: Request, res: Response): Promise<void> {
  try {
    const activityId = parseInt(req.params.activityId, 10);
    const deleted = await activityService.deleteActivity(activityId);

    if (!deleted) {
      res.status(404).json({ success: false, message: "Activity not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Activity deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting activity:", error);
    res.status(500).json({ success: false, message: "Failed to delete activity" });
  }
}

