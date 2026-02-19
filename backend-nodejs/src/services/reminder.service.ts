import { CreateReminderDTO, UpdateReminderDTO, ReminderDTO } from "../dtos/reminder.dto";
import * as reminderModel from "../models/reminder.model";

export async function createReminder(data: CreateReminderDTO): Promise<ReminderDTO> {
  return reminderModel.createReminder(data);
}

export async function getReminder(reminderId: number): Promise<ReminderDTO | null> {
  return reminderModel.findReminderById(reminderId);
}

export async function getBabyReminders(babyId: number): Promise<ReminderDTO[]> {
  return reminderModel.findRemindersByBabyId(babyId);
}

export async function updateReminder(reminderId: number, data: UpdateReminderDTO): Promise<ReminderDTO | null> {
  return reminderModel.updateReminder(reminderId, data);
}

export async function deleteReminder(reminderId: number): Promise<boolean> {
  return reminderModel.deleteReminder(reminderId);
}
