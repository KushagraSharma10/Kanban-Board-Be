import { Response } from "express";
import type { AuthenticatedRequest } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import {
  createBoardService,
  listBoardsForUser,
  getBoard,
  updateBoardService,
  deleteBoardService,
} from "../services/board.service.js";

export const createBoard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const creatorId = req.userId!;
  const { name, type, color } = req.body;

  const board = await createBoardService(creatorId, { name, type, color });
  res.status(201).json({ success: true, message: "Board created", data: board });
});

export const getMyBoards = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const boards = await listBoardsForUser(userId);
  res.status(200).json({ success: true, data: boards });
});

export const getBoardById = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  const board = await getBoard(userId, id);
  res.status(200).json({ success: true, data: board });
});

export const updateBoard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;
  const { name, type, color } = req.body;

  const updated = await updateBoardService(userId, id, { name, type, color });
  res.status(200).json({ success: true, message: "Board updated", data: updated });
});

export const deleteBoard = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.userId!;
  const { id } = req.params;

  await deleteBoardService(userId, id);
  res.status(200).json({ success: true, message: "Board deleted" });
});
