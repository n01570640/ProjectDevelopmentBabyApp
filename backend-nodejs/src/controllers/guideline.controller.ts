import { Request, Response } from "express";
import {
  getAllVaccines,
  getVaccineById,
  getVaccinesDueByAge,
  getUpcomingVaccines,
} from "../data/vaccines.data";
import { VaccineDTO, weeksToAgeDisplay } from "../dtos/vaccine.dto";

/**
 * Format vaccine data for API response
 */
function formatVaccine(vaccine: {
  vaccine_id: number;
  vaccine_name: string;
  schedule_weeks: number;
  notes: string;
}): VaccineDTO {
  return {
    vaccine_id: vaccine.vaccine_id,
    vaccine_name: vaccine.vaccine_name,
    schedule_weeks: vaccine.schedule_weeks,
    schedule_age_display: weeksToAgeDisplay(vaccine.schedule_weeks),
    notes: vaccine.notes,
  };
}

/**
 * GET /api/v1/guidelines/vaccines
 * List all vaccines from CDC schedule
 */
export async function listVaccines(req: Request, res: Response): Promise<void> {
  try {
    const vaccines = getAllVaccines();
    const formattedVaccines = vaccines.map(formatVaccine);

    res.status(200).json({
      success: true,
      data: {
        vaccines: formattedVaccines,
        total: formattedVaccines.length,
      },
    });
  } catch (error: any) {
    console.error("Error listing vaccines:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list vaccines",
    });
  }
}

/**
 * GET /api/v1/guidelines/vaccines/:vaccineId
 * Get vaccine details by ID
 */
export async function getVaccine(req: Request, res: Response): Promise<void> {
  try {
    const vaccineId = parseInt(req.params.vaccineId, 10);

    if (isNaN(vaccineId)) {
      res.status(400).json({
        success: false,
        message: "Invalid vaccine ID",
      });
      return;
    }

    const vaccine = getVaccineById(vaccineId);

    if (!vaccine) {
      res.status(404).json({
        success: false,
        message: "Vaccine not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: formatVaccine(vaccine),
    });
  } catch (error: any) {
    console.error("Error getting vaccine:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get vaccine",
    });
  }
}

/**
 * GET /api/v1/guidelines/vaccines/schedule/:ageWeeks
 * Get vaccines due and upcoming for a specific age
 */
export async function getVaccineSchedule(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const ageWeeks = parseInt(req.params.ageWeeks, 10);

    if (isNaN(ageWeeks) || ageWeeks < 0) {
      res.status(400).json({
        success: false,
        message: "Invalid age in weeks",
      });
      return;
    }

    const dueVaccines = getVaccinesDueByAge(ageWeeks).map(formatVaccine);
    const upcomingVaccines = getUpcomingVaccines(ageWeeks).map(formatVaccine);

    res.status(200).json({
      success: true,
      data: {
        age_weeks: ageWeeks,
        age_display: weeksToAgeDisplay(ageWeeks),
        due_vaccines: dueVaccines,
        upcoming_vaccines: upcomingVaccines,
      },
    });
  } catch (error: any) {
    console.error("Error getting vaccine schedule:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get vaccine schedule",
    });
  }
}
