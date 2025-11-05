import { Types } from "mongoose";
import { TaskPriority } from "../types/task";

export interface TaskDocument extends Document {
  boardId: Types.ObjectId;
  columnId: Types.ObjectId;
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: Date;
  assigneeId?: Types.ObjectId | null;
  assigneeEmail?: string | null;
  position: number; 
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTaskParams {
  boardId: string;
  columnId: string;
}

export interface UpdateTaskParams {
  boardId: string;
  columnId: string;
  taskId: string;
}

export interface GetTasksParams {
  boardId: string;
  columnId: string;
}

export interface GetTaskParams {
  boardId: string;
  columnId: string;
  taskId: string;
}

export interface DeleteTaskParams {
  boardId: string;
  columnId: string;
  taskId: string;
}

export interface CreateTaskBody {
  title: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  assigneeEmail?: string | null;
}

export interface UpdateTaskBody {
  title?: string;
  description?: string | null;
  priority?: "low" | "medium" | "high";
  dueDate?: string | null;
  assigneeEmail?: string | null;
}
