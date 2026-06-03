import { body } from "express-validator";
import { idParamValidator, optionalDateValidator } from "./common.validator";

const TASK_STATUSES = ["pending", "in_progress", "done"];

export const createTaskValidator = [
  idParamValidator("babyId"),
  body("title").trim().notEmpty().withMessage("title is required").isLength({ max: 200 }).withMessage("title must be at most 200 characters"),
  body("description").optional({ nullable: true }).trim().isLength({ max: 1000 }).withMessage("description must be at most 1000 characters"),
  optionalDateValidator("due_at"),
  body("status").optional({ nullable: true }).isIn(TASK_STATUSES).withMessage(`status must be one of: ${TASK_STATUSES.join(", ")}`),
  body("assigned_to").optional({ nullable: true }).isInt({ min: 1 }).withMessage("assigned_to must be a valid user ID"),
];

export const updateTaskValidator = [
  idParamValidator("babyId"),
  idParamValidator("taskId"),
  body("title").optional().trim().notEmpty().isLength({ max: 200 }),
  body("description").optional({ nullable: true }).trim().isLength({ max: 1000 }),
  optionalDateValidator("due_at"),
  body("status").optional({ nullable: true }).isIn(TASK_STATUSES).withMessage(`status must be one of: ${TASK_STATUSES.join(", ")}`),
  body("assigned_to").optional({ nullable: true }).isInt({ min: 1 }),
];

export const taskIdValidator = [
  idParamValidator("babyId"),
  idParamValidator("taskId"),
];

export const listTasksValidator = [idParamValidator("babyId")];

