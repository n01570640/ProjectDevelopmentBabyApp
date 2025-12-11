import { CreateActivityDTO, ActivityDTO } from "../dtos/activity.dto";
import { createActivity } from "../models/activity.model";

export async function addActivity(data: CreateActivityDTO): Promise<ActivityDTO> {
  return await createActivity(data);
}
