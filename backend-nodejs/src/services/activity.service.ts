import { CreateActivityDTO, UpdateActivityDTO, ActivityDTO } from "../dtos/activity.dto";
import * as activityModel from "../models/activity.model";

export async function createActivity(data: CreateActivityDTO): Promise<ActivityDTO> {
  return activityModel.createActivity(data);
}

export async function getActivity(activityId: number): Promise<ActivityDTO | null> {
  return activityModel.findActivityById(activityId);
}

export async function getBabyActivities(babyId: number): Promise<ActivityDTO[]> {
  return activityModel.findActivitiesByBabyId(babyId);
}

export async function updateActivity(
  activityId: number,
  data: UpdateActivityDTO
): Promise<ActivityDTO | null> {
  return activityModel.updateActivity(activityId, data);
}

export async function deleteActivity(activityId: number): Promise<boolean> {
  return activityModel.deleteActivity(activityId);
}
