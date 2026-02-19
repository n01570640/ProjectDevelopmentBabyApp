import { Request, Response } from "express";
import * as taskService from "../services/task.service";
import { CreateTaskDTO, UpdateTaskDTO } from "../dtos/task.dto";

/**
 * POST /api/v1/babies/:babyId/tasks
 */
export async function createTask(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.user?.user_id;
    const babyId = parseInt(req.params.babyId, 10);

    if (!userId) {
      res.status(401).json({ success: false, message: "Authentication required" });
      return;
    }

    const data: CreateTaskDTO = {
      baby_id:     babyId,
      created_by:  userId,
      assigned_to: req.body.assigned_to ?? null,
      title:       req.body.title,
      description: req.body.description ?? null,
      due_at:      req.body.due_at ? new Date(req.body.due_at) : null,
      status:      req.body.status ?? "pending",
    };

    const task = await taskService.createTask(data);

    res.status(201).json({ success: true, message: "Task created successfully", data: task });
  } catch (error: any) {
    console.error("Error creating task:", error);
    res.status(500).json({ success: false, message: "Failed to create task" });
  }
}

/**
 * GET /api/v1/babies/:babyId/tasks
 */
export async function listTasks(req: Request, res: Response): Promise<void> {
  try {
    const babyId = parseInt(req.params.babyId, 10);
    const tasks = await taskService.getBabyTasks(babyId);
    res.status(200).json({ success: true, data: tasks, total: tasks.length });
  } catch (error: any) {
    console.error("Error listing tasks:", error);
    res.status(500).json({ success: false, message: "Failed to list tasks" });
  }
}

/**
 * GET /api/v1/babies/:babyId/tasks/:taskId
 */
export async function getTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const task = await taskService.getTask(taskId);

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    res.status(200).json({ success: true, data: task });
  } catch (error: any) {
    console.error("Error getting task:", error);
    res.status(500).json({ success: false, message: "Failed to get task" });
  }
}

/**
 * PUT /api/v1/babies/:babyId/tasks/:taskId
 */
export async function updateTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = parseInt(req.params.taskId, 10);

    const data: UpdateTaskDTO = {};
    if (req.body.title       !== undefined) data.title       = req.body.title;
    if (req.body.description !== undefined) data.description = req.body.description;
    if (req.body.due_at      !== undefined) data.due_at      = req.body.due_at ? new Date(req.body.due_at) : null;
    if (req.body.status      !== undefined) data.status      = req.body.status;
    if (req.body.assigned_to !== undefined) data.assigned_to = req.body.assigned_to;

    const task = await taskService.updateTask(taskId, data);

    if (!task) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Task updated successfully", data: task });
  } catch (error: any) {
    console.error("Error updating task:", error);
    res.status(500).json({ success: false, message: "Failed to update task" });
  }
}

/**
 * DELETE /api/v1/babies/:babyId/tasks/:taskId
 */
export async function deleteTask(req: Request, res: Response): Promise<void> {
  try {
    const taskId = parseInt(req.params.taskId, 10);
    const deleted = await taskService.deleteTask(taskId);

    if (!deleted) {
      res.status(404).json({ success: false, message: "Task not found" });
      return;
    }
    res.status(200).json({ success: true, message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting task:", error);
    res.status(500).json({ success: false, message: "Failed to delete task" });
  }
}

