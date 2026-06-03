import express from "express";
import * as taskController from "../controllers/task.controller";
import { verifyTokenMiddleware } from "../middleware/auth.middleware";
import { requireBabyAccess } from "../middleware/rbac.middleware";
import { validate } from "../middleware/validation.middleware";
import {
  createTaskValidator,
  updateTaskValidator,
  taskIdValidator,
  listTasksValidator,
} from "../validators/task.validator";

const router = express.Router();

router.use(verifyTokenMiddleware);

// POST /api/v1/babies/:babyId/tasks
router.post(
  "/:babyId/tasks",
  createTaskValidator, validate,
  requireBabyAccess,
  taskController.createTask
);

// GET /api/v1/babies/:babyId/tasks
router.get(
  "/:babyId/tasks",
  listTasksValidator, validate,
  requireBabyAccess,
  taskController.listTasks
);

// GET /api/v1/babies/:babyId/tasks/:taskId
router.get(
  "/:babyId/tasks/:taskId",
  taskIdValidator, validate,
  requireBabyAccess,
  taskController.getTask
);

// PUT /api/v1/babies/:babyId/tasks/:taskId
router.put(
  "/:babyId/tasks/:taskId",
  updateTaskValidator, validate,
  requireBabyAccess,
  taskController.updateTask
);

// DELETE /api/v1/babies/:babyId/tasks/:taskId
router.delete(
  "/:babyId/tasks/:taskId",
  taskIdValidator, validate,
  requireBabyAccess,
  taskController.deleteTask
);

export default router;

