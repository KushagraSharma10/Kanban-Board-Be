import { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  createTask,
  updateTask,
  getTasks,
  deleteTask,
  getTask,
} from "../services/task.service.js";
import { CreateTaskParams, CreateTaskBody , UpdateTaskParams,
  UpdateTaskBody,
  GetTasksParams,
  DeleteTaskParams,
  GetTaskParams, } from "../interfaces/task.js";

export const createTaskInColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const taskDoc = await createTask(userId, req.params as unknown as CreateTaskParams, req.body as CreateTaskBody);
  res.status(201).json({ success: true, message: "Task created", data: taskDoc });
});

export const updateTaskDetails = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const updated = await updateTask(userId, req.params as unknown as UpdateTaskParams, req.body as UpdateTaskBody);
  res.status(200).json({ success: true, message: "Task updated successfully", data: updated });
});

export const getTasksForColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const list = await getTasks(userId, req.params as unknown as GetTasksParams);
  res.status(200).json({ success: true, message: "Tasks fetched successfully", data: list });
});

export const deleteTaskFromColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  await deleteTask(userId, req.params as unknown as DeleteTaskParams);
  res.status(200).json({ success: true, message: "Task deleted successfully" });
});

export const getTaskById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const task = await getTask(userId, req.params as unknown as GetTaskParams);
  res.status(200).json({ success: true, message: "Task fetched successfully", data: task });
});
