import { Request, Response } from "express";
import * as boardService from "../services/board.service.js"
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";


export const getBoards = asyncHandler(async (_req, res) => {
  const boards = await boardService.getBoardsService();
  res.status(200).json({ success: true, data: boards });
});

export const getBoardById = asyncHandler(async (req, res) => {
  const board = await boardService.getBoardByIdService(req.params.id);
  if (!board) throw new ApiError(404, "Board not found.");
  res.status(200).json({ success: true, data: board });
});

export const createBoard = asyncHandler(async (req, res) => {
  const { name, color } = req.body;
  if (!name || !color) throw new ApiError(400, "Missing name or color.");
  const newBoard = await boardService.createBoardService(name, color);
  res.status(201).json({ success: true, message: "Board created.", data: newBoard });
});

export const updateBoard = asyncHandler(async (req, res) => {
  const updates = req.body;
  if (!Object.keys(updates).length) {
    throw new ApiError(400, "No fields provided for update.");
  }
  const updatedBoard = await boardService.updateBoardService(req.params.id, updates);
  if (!updatedBoard) throw new ApiError(404, "Board not found for update.");
  res.status(200).json({ success: true, message: "Board updated.", data: updatedBoard });
});

export const deleteBoard = asyncHandler(async (req, res) => {
  const success = await boardService.deleteBoardService(req.params.id);
  if (!success) throw new ApiError(404, "Board not found to delete.");
  res.status(204).send();
});            