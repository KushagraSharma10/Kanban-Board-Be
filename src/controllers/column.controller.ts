import { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  getColumn,
  reorderColumnsService,
  deleteColumnService,
  updateColumnService,
  createColumnService,
  listColumnsForBoard,
} from "../services/column.service.js";

export const getColumnsForBoard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { boardId } = req.params;
  const columns = await listColumnsForBoard(userId, boardId);
  res.status(200).json({ success: true, data: columns });
});

export const createColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { boardId } = req.params;
  const { name } = req.body;
  const column = await createColumnService(userId, boardId, name);
  res.status(201).json({ success: true, message: "Column created", data: column });
});

export const updateColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { boardId, columnId } = req.params;
  const { name } = req.body;
  const updated = await updateColumnService(userId, boardId, columnId, name);
  res.status(200).json({ success: true, message: "Column updated", data: updated });
});

export const deleteColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { boardId, columnId } = req.params;
  await deleteColumnService(userId, boardId, columnId);
  res.status(200).json({ success: true, message: "Column deleted" });
});

export const reorderColumns = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { boardId } = req.params;
  const { updates } = req.body as { updates: Array<{ columnId: string; position: number }> };
  const reordered = await reorderColumnsService(userId, boardId, updates);
  res.status(200).json({ success: true, message: "Columns reordered", data: reordered });
});

export const getSingleColumn = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { boardId, columnId } = req.params;
  const column = await getColumn(userId, boardId, columnId);
  res.status(200).json({ success: true, data: column });
});
