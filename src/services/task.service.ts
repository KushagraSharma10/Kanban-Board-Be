import mongoose, { Types } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { isAdmin, isMember, toObjectId } from "../utils/boardAuth.js";
import { BoardModel } from "../models/board.model.js";
import { ColumnModel } from "../models/column.model.js";
import {
  createTaskDoc,
  findLastTaskInColumn,
  findTasksByColumnSorted,
  findTaskInBoardColumn,
  updateTaskById,
  deleteTaskInBoardColumn,
  compactTaskPositionsAfter,
} from "../dao/task.dao.js";
import { ensureAssigneeMembershipAndResolveIds } from "../utils/assignee.helper.js";

const isValidObjectId = mongoose.Types.ObjectId.isValid;

const ensureBoardAndMember = async (requestingUserId: string, boardId: string) => {
  const boardDoc = await BoardModel.findById(boardId);
  if (!boardDoc) throw new ApiError(204, "Board not found");
  if (!isMember(requestingUserId, boardDoc)) throw new ApiError(403, "Not a board member");
  return boardDoc;
};

const ensureColumnInBoard = async (boardId: string, columnId: string) => {
  const exists = await ColumnModel.exists({ _id: columnId, boardId });
  if (!exists) throw new ApiError(204, "Column not found");
};


export const createTask = async (
  requestingUserId: string,
  params: { boardId: string; columnId: string },
  body: {
    title: string;
    description?: string | null;
    priority?: "low" | "medium" | "high";
    dueDate?: string | null;
    assigneeEmail?: string | null; 
  }
) => {
  const { boardId, columnId } = params;

  if (!isValidObjectId(boardId) || !isValidObjectId(columnId)) {
    throw new ApiError(400, "Invalid boardId or columnId");
  }
  if (!body?.title || body.title.trim() === "") {
    throw new ApiError(400, "Task title is required");
  }

  await ensureBoardAndMember(requestingUserId, boardId);
  await ensureColumnInBoard(boardId, columnId);

  let resolvedAssigneeId: Types.ObjectId | null = null;
  let resolvedAssigneeEmail: string | null = null;

  if (typeof body.assigneeEmail !== "undefined") {
    const { assigneeUserId, normalizedAssigneeEmail } =
      await ensureAssigneeMembershipAndResolveIds(body.assigneeEmail ?? null, boardId);
    resolvedAssigneeId = assigneeUserId;
    resolvedAssigneeEmail = normalizedAssigneeEmail;
  }

  const last = await findLastTaskInColumn(boardId, columnId);
  const nextPosition = last.length > 0 ? (last[0].position ?? 0) + 1 : 0;

  const doc = await createTaskDoc({
    boardId: toObjectId(boardId),
    columnId: toObjectId(columnId),
    title: body.title.trim(),
    description: body.description ?? undefined,
    priority: body.priority ?? undefined,
    dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    assigneeId: resolvedAssigneeId,
    assigneeEmail: resolvedAssigneeEmail,
    position: nextPosition,
    createdBy: toObjectId(requestingUserId),
  });

  return doc;
};

export const updateTask = async (
  requestingUserId: string,
  params: { boardId: string; columnId: string; taskId: string },
  body: {
    title?: string;
    description?: string | null;
    priority?: "low" | "medium" | "high";
    dueDate?: string | null;
    assigneeEmail?: string | null;
  }
) => {
  const { boardId, columnId, taskId } = params;

  if (!isValidObjectId(boardId) || !isValidObjectId(columnId) || !isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid IDs in path");
  }

  const boardDoc = await BoardModel.findById(boardId);
  if (!boardDoc) throw new ApiError(204, "Board not found");
  if (!isAdmin(requestingUserId, boardDoc)) throw new ApiError(403, "Only admin can update tasks");

  await ensureColumnInBoard(boardId, columnId);

  const existing = await findTaskInBoardColumn(boardId, columnId, taskId);
  if (!existing) throw new ApiError(204, "Task not found");

  const updatePayload: Record<string, unknown> = {};
  if (typeof body.title !== "undefined") updatePayload.title = body.title;
  if (typeof body.description !== "undefined") updatePayload.description = body.description;
  if (typeof body.priority !== "undefined") updatePayload.priority = body.priority;
  if (typeof body.dueDate !== "undefined")
    updatePayload.dueDate = body.dueDate ? new Date(body.dueDate) : null;

  if (typeof body.assigneeEmail !== "undefined") {
    const { assigneeUserId, normalizedAssigneeEmail } =
      await ensureAssigneeMembershipAndResolveIds(body.assigneeEmail ?? null, boardId);

    updatePayload.assigneeId = assigneeUserId;
    updatePayload.assigneeEmail = normalizedAssigneeEmail;
  }

  const updated = await updateTaskById(taskId, updatePayload);
  return updated;
};

export const getTasks = async (
  requestingUserId: string,
  params: { boardId: string; columnId: string }
) => {
  const { boardId, columnId } = params;

  if (!boardId || !columnId) throw new ApiError(400, "BoardId and ColumnId are required");

  await ensureBoardAndMember(requestingUserId, boardId);
  await ensureColumnInBoard(boardId, columnId);

  return findTasksByColumnSorted(boardId, columnId);
};

export const deleteTask = async (
  requestingUserId: string,
  params: { boardId: string; columnId: string; taskId: string }
) => {
  const { boardId, columnId, taskId } = params;

  if (!isValidObjectId(boardId) || !isValidObjectId(columnId) || !isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid IDs in path");
  }

  const boardDoc = await BoardModel.findById(boardId);
  if (!boardDoc) throw new ApiError(204, "Board not found");
  if (!isAdmin(requestingUserId, boardDoc)) throw new ApiError(403, "Only admin can delete tasks");

  await ensureColumnInBoard(boardId, columnId);

  const deleted = await deleteTaskInBoardColumn(boardId, columnId, taskId);
  if (!deleted) throw new ApiError(204, "Task not found");

  await compactTaskPositionsAfter(boardId, columnId, deleted.position);
  return true;
};

export const getTask = async (
  requestingUserId: string,
  params: { boardId: string; columnId: string; taskId: string }
) => {
  const { boardId, columnId, taskId } = params;

  if (!isValidObjectId(boardId) || !isValidObjectId(columnId) || !isValidObjectId(taskId)) {
    throw new ApiError(400, "Invalid IDs in path");
  }

  await ensureBoardAndMember(requestingUserId, boardId);
  await ensureColumnInBoard(boardId, columnId);

  const task = await findTaskInBoardColumn(boardId, columnId, taskId);
  if (!task) throw new ApiError(204, "Task not found");
  return task;
};
