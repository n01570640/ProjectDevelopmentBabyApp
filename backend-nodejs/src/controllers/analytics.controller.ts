import { Request, Response } from "express";
import * as analyticsService from "../services/analytics.service";

/**
 * GET /api/v1/analytics/baby/:babyId/summary
 * Dashboard summary for a baby
 */
export async function getBabySummary(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const summary = await analyticsService.getBabySummary(babyId);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    console.error("Error getting baby summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get baby summary",
    });
  }
}

/**
 * GET /api/v1/analytics/baby/:babyId/graphs
 * Graph/chart data for a baby
 */
export async function getBabyGraphs(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const graphs = await analyticsService.getBabyGraphs(babyId);

    res.status(200).json({
      success: true,
      data: graphs,
    });
  } catch (error: any) {
    console.error("Error getting baby graphs:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get baby graph data",
    });
  }
}
