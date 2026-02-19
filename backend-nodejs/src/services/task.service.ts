import { CreateTaskDTO, UpdateTaskDTO, TaskDTO } from "../dtos/task.dto";
import * as taskModel from "../models/task.model";

export async function createTask(data: CreateTaskDTO): Promise<TaskDTO> {
  return taskModel.createTask(data);
}

export async function getTask(taskId: number): Promise<TaskDTO | null> {
  return taskModel.findTaskById(taskId);
}

export async function getBabyTasks(babyId: number): Promise<TaskDTO[]> {
  return taskModel.findTasksByBabyId(babyId);
}

export async function updateTask(taskId: number, data: UpdateTaskDTO): Promise<TaskDTO | null> {
  return taskModel.updateTask(taskId, data);
}

export async function deleteTask(taskId: number): Promise<boolean> {
  return taskModel.deleteTask(taskId);
}
