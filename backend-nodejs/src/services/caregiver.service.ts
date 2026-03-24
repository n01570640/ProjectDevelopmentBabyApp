import * as caregiverAccessModel from "../models/caregiver-access.model";

/**
 * List all caregivers for a baby with user details
 */
export async function listCaregivers(babyId: number) {
  return await caregiverAccessModel.getBabyCaregiversWithUserInfo(babyId);
}

/**
 * Remove a caregiver's access to a baby
 */
export async function removeAccess(userId: number, babyId: number): Promise<boolean> {
  return await caregiverAccessModel.removeCaregiverAccess(userId, babyId);
}
