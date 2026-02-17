import { Request, Response } from "express";
import * as invitationService from "../services/invitation.service";
import { CreateInvitationDTO } from "../dtos/invitation.dto";

/**
 * POST /api/v1/babies/:babyId/invitations
 * Create a new invitation (requires can_share permission)
 */
export async function createInvitation(
  req: Request,
  res: Response
): Promise<void> {
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

    const data: CreateInvitationDTO = {
      invited_email: req.body.invited_email,
      invited_role: req.body.invited_role,
    };

    const invitation = await invitationService.createInvitation(
      babyId,
      userId,
      data
    );

    res.status(201).json({
      success: true,
      message: "Invitation created successfully",
      data: invitation,
    });
  } catch (error: any) {
    console.error("Error creating invitation:", error);

    // Handle known errors
    if (error.message.includes("already a pending invitation")) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    if (error.message.includes("already has access")) {
      res.status(409).json({
        success: false,
        message: error.message,
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: "Failed to create invitation",
    });
  }
}

/**
 * GET /api/v1/babies/:babyId/invitations
 * List pending invitations for a baby (requires can_share permission)
 */
export async function listInvitations(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    const invitations = await invitationService.getPendingInvitations(babyId);

    res.status(200).json({
      success: true,
      data: invitations,
    });
  } catch (error: any) {
    console.error("Error listing invitations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to list invitations",
    });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/invitations/:inviteId
 * Cancel an invitation (inviter only)
 */
export async function cancelInvitation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const inviteId = parseInt(req.params.inviteId, 10);

    if (!userId) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await invitationService.cancelInvitation(inviteId, userId);

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error: any) {
    console.error("Error cancelling invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to cancel invitation",
    });
  }
}

/**
 * GET /api/v1/invitations/:token
 * Get invitation details by token (public - for viewing before accepting)
 */
export async function getInvitationByToken(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const token = req.params.token;

    const invitation = await invitationService.getInvitationByToken(token);

    if (!invitation) {
      res.status(404).json({
        success: false,
        message: "Invitation not found",
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: invitation,
    });
  } catch (error: any) {
    console.error("Error getting invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get invitation",
    });
  }
}

/**
 * POST /api/v1/invitations/:token/accept
 * Accept an invitation (requires authentication)
 */
export async function acceptInvitation(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const userEmail = req.user?.email;
    const token = req.params.token;

    if (!userId || !userEmail) {
      res.status(401).json({
        success: false,
        message: "Authentication required",
      });
      return;
    }

    const result = await invitationService.acceptInvitation(
      token,
      userId,
      userEmail
    );

    if (!result.success) {
      res.status(400).json({
        success: false,
        message: result.message,
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        baby_id: result.baby_id,
      },
    });
  } catch (error: any) {
    console.error("Error accepting invitation:", error);
    res.status(500).json({
      success: false,
      message: "Failed to accept invitation",
    });
  }
}
