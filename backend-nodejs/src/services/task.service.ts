import { CreateTaskDTO, TaskDTO } from "../dtos/task.dto";
import { createTask } from "../models/task.model";

export async function addTask(data: CreateTaskDTO): Promise<TaskDTO> {
  return await createTask(data);
}
