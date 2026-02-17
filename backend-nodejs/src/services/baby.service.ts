import { CreateBabyDTO, BabyDTO, UpdateBabyDTO, BabyWithAccessDTO, BabyWithDetailsDTO } from "../dtos/baby.dto";
import * as babyModel from "../models/baby.model";
import * as caregiverAccessModel from "../models/caregiver-access.model";
import { AccessRole } from "../dtos/caregiver-access.dto";

/**
 * Create a new baby and auto-assign the creator as PRIMARY_CAREGIVER
 */
export async function createBabyWithAccess(
  data: CreateBabyDTO,
  userId: number
): Promise<BabyDTO> {
  // Create the baby record
  const baby = await babyModel.createBaby(data);

  // Auto-assign the creator as PRIMARY_CAREGIVER with all permissions
  await caregiverAccessModel.createCaregiverAccess({
    baby_id: baby.baby_id,
    user_id: userId,
    access_role: AccessRole.PRIMARY_CAREGIVER,
    can_edit_health: true,
    can_edit_activities: true,
    can_share: true,
  });

  return baby;
}

/**
 * Get baby by ID
 */
export async function getBaby(baby_id: number): Promise<BabyDTO | null> {
  return await babyModel.findBabyById(baby_id);
}

/**
 * Get all babies accessible by a user
 */
export async function getUserBabies(userId: number): Promise<BabyWithAccessDTO[]> {
  return await babyModel.findBabiesByUserId(userId);
}

/**
 * Get all babies accessible by a user with full details (latest growth + primary caregiver)
 */
export async function getUserBabiesWithDetails(userId: number): Promise<BabyWithDetailsDTO[]> {
  return await babyModel.findBabiesWithDetailsByUserId(userId);
}

/**
 * Get a single baby with full details (latest growth + primary caregiver)
 */
export async function getBabyWithDetails(babyId: number, userId: number): Promise<BabyWithDetailsDTO | null> {
  return await babyModel.findBabyWithDetailsById(babyId, userId);
}

/**
 * Update baby details
 */
export async function updateBaby(
  baby_id: number,
  data: UpdateBabyDTO
): Promise<BabyDTO | null> {
  return await babyModel.updateBaby(baby_id, data);
}

/**
 * Delete baby and all related data (PRIMARY_CAREGIVER only)
 */
export async function deleteBaby(baby_id: number): Promise<boolean> {
  return await babyModel.deleteBaby(baby_id);
}

/**
 * Remove a user's access to a baby (for secondary/professional caregivers)
 */
export async function removeAccess(baby_id: number, user_id: number): Promise<boolean> {
  return await caregiverAccessModel.removeCaregiverAccess(user_id, baby_id);
}

// Legacy function for backward compatibility
export async function addBaby(data: CreateBabyDTO): Promise<BabyDTO> {
  return await babyModel.createBaby(data);
}
