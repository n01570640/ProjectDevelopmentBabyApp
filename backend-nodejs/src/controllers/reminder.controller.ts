import { Request, Response } from "express";
import * as reminderService from "../services/reminder.service";
import { CreateReminderDTO, UpdateReminderDTO } from "../dtos/reminder.dto";

/**
 * POST /api/v1/babies/:babyId/reminders
 */
export async function createReminder(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const data: CreateReminderDTO = {
      baby_id:    babyId,
      created_by: userId,
      title:      req.body.title,
      body:       req.body.body   ?? null,
      due_at:     new Date(req.body.due_at),
      rrule:      req.body.rrule  ?? null,
    };

    const reminder = await reminderService.createReminder(data);

    res.status(201).json({ success: true, message: "Reminder created successfully", data: reminder });
  } catch (error: any) {
    console.error("Error creating reminder:", error);
    res.status(500).json({ success: false, message: "Failed to create reminder" });
  }
}

/**
 * GET /api/v1/babies/:babyId/reminders
 */
export async function listReminders(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);

    if (isNaN(babyId)) {
      res.status(400).json({ success: false, message: "Invalid baby ID" });
      return;
    }

    const reminders = await reminderService.getBabyReminders(babyId);
    res.status(200).json({ success: true, data: reminders, total: reminders.length });
  } catch (error: any) {
    console.error("Error listing reminders:", error);
    res.status(500).json({ success: false, message: "Failed to list reminders" });
  }
}

/**
 * GET /api/v1/babies/:babyId/reminders/:reminderId
 */
export async function getReminder(req: Request, res: Response): Promise<void> {
  try {
    const reminderId = parseInt(req.params.reminderId, 10);

    if (isNaN(reminderId)) {
      res.status(400).json({ success: false, message: "Invalid reminder ID" });
      return;
    }

    const reminder = await reminderService.getReminder(reminderId);

    if (!reminder) {
      res.status(404).json({ success: false, message: "Reminder not found" });
      return;
    }
    res.status(200).json({ success: true, data: reminder });
  } catch (error: any) {
    console.error("Error getting reminder:", error);
    res.status(500).json({ success: false, message: "Failed to get reminder" });
  }
}

/**
 * PUT /api/v1/babies/:babyId/reminders/:reminderId
 */
export async function updateReminder(req: Request, res: Response): Promise<void> {
  try {
    const reminderId = parseInt(req.params.reminderId, 10);

    if (isNaN(reminderId)) {
      res.status(400).json({ success: false, message: "Invalid reminder ID" });
      return;
    }

    const data: UpdateReminderDTO = {};
    if (req.body.title     !== undefined) data.title     = req.body.title;
    if (req.body.body      !== undefined) data.body      = req.body.body;
    if (req.body.due_at    !== undefined) data.due_at    = new Date(req.body.due_at);
    if (req.body.rrule     !== undefined) data.rrule     = req.body.rrule;
    if (req.body.is_active !== undefined) data.is_active = req.body.is_active;

    const reminder = await reminderService.updateReminder(reminderId, data);

    if (!reminder) {
      res.status(404).json({ success: false, message: "Reminder not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Reminder updated successfully", data: reminder });
  } catch (error: any) {
    console.error("Error updating reminder:", error);
    res.status(500).json({ success: false, message: "Failed to update reminder" });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/reminders/:reminderId
 */
export async function deleteReminder(req: Request, res: Response): Promise<void> {
  try {
    const reminderId = parseInt(req.params.reminderId, 10);

    if (isNaN(reminderId)) {
      res.status(400).json({ success: false, message: "Invalid reminder ID" });
      return;
    }

    const deleted = await reminderService.deleteReminder(reminderId);

    if (!deleted) {
      res.status(404).json({ success: false, message: "Reminder not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Reminder deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting reminder:", error);
    res.status(500).json({ success: false, message: "Failed to delete reminder" });
  }
}

