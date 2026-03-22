import * as growthModel from "../models/growth.model";
import {
  CreateGrowthDTO,
  UpdateGrowthDTO,
  GrowthDTO,
  LatestGrowthDTO,
} from "../dtos/growth.dto";

/**
 * Create growth record
 */
export async function createGrowth(
  babyId: number,
  recordedBy: number,
  data: CreateGrowthDTO
): Promise<GrowthDTO> {
  // Validate at least one measurement is provided
  if (data.weight_kg == null && data.length_cm == null && data.head_circum_cm == null) {
    throw new Error("At least one measurement (weight, length, or head circumference) is required");
  }

  return await growthModel.createGrowth(babyId, recordedBy, data);
}

/**
 * Get growth record by ID
 */
export async function getGrowth(growthId: number): Promise<GrowthDTO | null> {
  return await growthModel.findGrowthById(growthId);
}

/**
 * Get all growth records for a baby
 */
export async function getBabyGrowthHistory(babyId: number): Promise<GrowthDTO[]> {
  return await growthModel.findGrowthByBabyId(babyId);
}

/**
 * Get latest growth record for a baby
 */
export async function getLatestGrowth(babyId: number): Promise<LatestGrowthDTO | null> {
  return await growthModel.findLatestGrowth(babyId);
}

/**
 * Update growth record
 */
export async function updateGrowth(
  growthId: number,
  data: UpdateGrowthDTO
): Promise<GrowthDTO | null> {
  return await growthModel.updateGrowth(growthId, data);
}

/**
 * Delete growth record
 */
export async function deleteGrowth(growthId: number): Promise<boolean> {
  return await growthModel.deleteGrowth(growthId);
}

/**
 * Check if growth record belongs to baby
 */
export async function growthBelongsToBaby(
  growthId: number,
  babyId: number
): Promise<boolean> {
  return await growthModel.growthBelongsToBaby(growthId, babyId);
}
