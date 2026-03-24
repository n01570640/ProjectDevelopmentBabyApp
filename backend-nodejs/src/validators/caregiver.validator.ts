import { idParamValidator } from "./common.validator";

/**
 * Validators for caregiver management endpoints
 */

// GET /babies/:babyId/caregivers
export const listCaregiversValidator = [idParamValidator("babyId")];

// DELETE /babies/:babyId/caregivers/:userId
export const removeCaregiverValidator = [
  idParamValidator("babyId"),
  idParamValidator("userId"),
];
