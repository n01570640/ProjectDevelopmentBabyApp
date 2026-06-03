import { idParamValidator } from "./common.validator";

/**
 * Validators for analytics routes
 */

// GET /api/v1/analytics/baby/:babyId/summary
export const babySummaryValidator = [idParamValidator("babyId")];

// GET /api/v1/analytics/baby/:babyId/graphs
export const babyGraphsValidator = [idParamValidator("babyId")];
