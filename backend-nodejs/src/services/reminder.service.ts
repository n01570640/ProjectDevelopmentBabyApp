import { CreateReminderDTO, ReminderDTO } from "../dtos/reminder.dto";
import { createReminder } from "../models/reminder.model";

export async function addReminder(data: CreateReminderDTO): Promise<ReminderDTO> {
  return await createReminder(data);
}
