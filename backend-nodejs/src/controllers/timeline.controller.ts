import { Request, Response } from "express";
import * as timelineService from "../services/timeline.service";

/**
 * GET /api/v1/babies/:babyId/timeline
 * Returns a unified, chronologically sorted timeline of all events for a baby.
 * Supports ?limit=50&offset=0 for pagination.
 */
export async function getBabyTimeline(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Valid baby ID is required" });
      return;
    }

    const limit = Math.min(parseInt(req.query.limit as string, 10) || 50, 200);
    const offset = parseInt(req.query.offset as string, 10) || 0;

    const timeline = await timelineService.getBabyTimeline(babyId, limit, offset);

    res.status(200).json({ success: true, data: timeline });
  } catch (error: any) {
    console.error("Error fetching baby timeline:", error?.message ?? error);
    res.status(500).json({ success: false, message: "Failed to fetch timeline" });
  }
}
