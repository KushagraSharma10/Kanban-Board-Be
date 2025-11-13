import { Types } from "mongoose";
import { TaskModel } from "../models/task.model.js";
import { TaskPriority } from "../types/task.js";

export const findLastTaskInColumn = (boardId: string, columnId: string) =>
  TaskModel.findOne({ boardId, columnId }).sort({ position: -1 }).lean();

export const createTaskDoc = (input: {
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
}) => TaskModel.create(input);

export const findTasksByColumnSorted = (boardId: string, columnId: string) =>
  TaskModel.find({ boardId, columnId }).sort({ position: 1 }).lean();

export const findTaskInBoardColumn = (
  boardId: string,
  columnId: string,
  taskId: string
) => TaskModel.findOne({ _id: taskId, boardId, columnId });

export const updateTaskById = (
  taskId: string,
  update: Partial<{
    title: string;
    description: string | null;
    priority: TaskPriority | null;      
    dueDate: Date | null;
    assigneeId: Types.ObjectId | null;
    assigneeEmail: string | null;
  }>
) => TaskModel.findByIdAndUpdate(taskId, update, { new: true });

export const deleteTaskInBoardColumn = (
  boardId: string,
  columnId: string,
  taskId: string
) => TaskModel.findOneAndDelete({ _id: taskId, boardId, columnId });

export const compactTaskPositionsAfter = (
  boardId: string,
  columnId: string,
  fromExclusive: number
) =>
  TaskModel.updateMany(
    { boardId, columnId, position: { $gt: fromExclusive } },
    { $inc: { position: -1 } }
  );
