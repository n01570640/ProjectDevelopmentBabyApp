import { Request, Response } from "express";
import * as babyService from "../services/baby.service";
import { CreateBabyDTO, UpdateBabyDTO } from "../dtos/baby.dto";

/**
 * POST /api/v1/babies
 * Create a new baby (user becomes PRIMARY_CAREGIVER)
 */
export async function createBaby(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const data: CreateBabyDTO = {
      display_name: req.body.display_name,
      date_of_birth: req.body.date_of_birth,
      sex: req.body.sex,
      blood_type: req.body.blood_type,
      notes: req.body.notes,
    };

    const baby = await babyService.createBabyWithAccess(data, userId);

    res.status(201).json({
      success: true,
      message: "Baby created successfully",
      data: baby,
    });
  } catch (error: any) {
    console.error("Error creating baby:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create baby",
    });
  }
}

/**
 * GET /api/v1/babies
 * List all babies accessible by the authenticated user (includes latest growth + primary caregiver)
 */
export async function listBabies(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    // Use detailed query to include latest growth and primary caregiver
    const babies = await babyService.getUserBabiesWithDetails(userId);

    res.status(200).json({
      success: true,
      data: babies,
    });
  } catch (error: any) {
    console.error("Error listing babies:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list babies",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId
 * Get baby details with latest growth + primary caregiver (requires baby access)
 */
export async function getBaby(req: Request, res: Response): Promise<void> {
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

    // Use detailed query to include latest growth and primary caregiver
    const baby = await babyService.getBabyWithDetails(babyId, userId);

    if (!baby) {
      res.status(404).json({
        success: false,
        message: "Baby not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: baby,
    });
  } catch (error: any) {
    console.error("Error getting baby:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get baby",
    });
  }
}

/**
 * PUT /api/v1/babies/:babyId
 * Update baby details (requires PRIMARY_CAREGIVER)
 */
export async function updateBaby(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    const data: UpdateBabyDTO = {};
    if (req.body.display_name !== undefined) data.display_name = req.body.display_name;
    if (req.body.date_of_birth !== undefined) data.date_of_birth = req.body.date_of_birth;
    if (req.body.sex !== undefined) data.sex = req.body.sex;
    if (req.body.blood_type !== undefined) data.blood_type = req.body.blood_type;
    if (req.body.notes !== undefined) data.notes = req.body.notes;

    const baby = await babyService.updateBaby(babyId, data);

    if (!baby) {
      res.status(404).json({
        success: false,
        message: "Baby not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: "Baby updated successfully",
      data: baby,
    });
  } catch (error: any) {
    console.error("Error updating baby:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update baby",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId
 * Primary caregiver: deletes baby and all related data
 * Secondary/Professional: removes only their own access
 */
export async function deleteBaby(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);
    const accessRole = req.babyAccess?.access_role;

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    if (accessRole === "PRIMARY_CAREGIVER") {
      // Primary caregiver: delete the baby entirely
      const deleted = await babyService.deleteBaby(babyId);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: "Baby not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        message: "Baby and all related data deleted successfully",
      });
    } else {
      // Secondary/Professional: remove only their own access
      await babyService.removeAccess(babyId, userId);

      res.status(200).json({
        success: true,
        message: "Baby removed from your account",
      });
    }
  } catch (error: any) {
    console.error("Error deleting baby:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete baby",
    });
  }
}
