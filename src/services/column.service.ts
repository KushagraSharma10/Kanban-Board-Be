import { Types } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { isAdmin, isMember } from "../utils/boardAuth.js";
import { BoardModel } from "../models/board.model.js";
import {
  countColumnsByBoardId,
  insertDefaultColumns,
  findColumnsByBoardIdSorted,
  findLastColumnInBoard,
  createColumnDoc,
  updateColumnName,
  deleteColumnById,
  compactPositionsAfter,
  findColumnsByIdsForBoard,
  findSingleColumnForBoard,
  findColumnByName,
} from "../dao/column.dao.js";
import { ColumnModel } from "../models/column.model.js";

const ensureBoardAndMembership = async (
  requestingUserId: string,
  boardId: string
) => {
  const board = await BoardModel.findById(boardId);
  if (!board) throw new ApiError(204, "Board not found");
  if (!isMember(requestingUserId, board))
    throw new ApiError(403, "Not a board member");
  return board;
};

const ensureBoardAndAdmin = async (
  requestingUserId: string,
  boardId: string
) => {
  const board = await ensureBoardAndMembership(requestingUserId, boardId); 
  if (!isAdmin(requestingUserId, board)) {
    throw new ApiError(403, "Only admins can perform this action");
  }
  return board;
};

export const listColumnsForBoard = async (
  requestingUserId: string,
  boardId: string
) => {
  await ensureBoardAndMembership(requestingUserId, boardId);

  const existingCount = await countColumnsByBoardId(boardId);
  if (!existingCount) {
    await insertDefaultColumns(boardId, requestingUserId, [
      "To Do",
      "In Progress",
      "Done",
    ]);
  }
  return findColumnsByBoardIdSorted(boardId);
};

export const createColumnService = async (
  requestingUserId: string,
  boardId: string,
  name: string
) => {
  if (!name || name.trim() === "")
    throw new ApiError(400, "Column name is required");

  await ensureBoardAndAdmin(requestingUserId, boardId);

  const lastColumn = await findLastColumnInBoard(boardId);
  const position = lastColumn ? (lastColumn.position ?? 0) + 1 : 0;

  return createColumnDoc({
    boardId,
    name: name.trim(),
    position,
    createdBy: requestingUserId,
  });
};

export const updateColumnService = async (
  requestingUserId: string,
  boardId: string,
  columnId: string,
  name: string
) => {
  if (!name || name.trim() === "")
    throw new ApiError(400, "Column name is required");

  await ensureBoardAndAdmin(requestingUserId, boardId);

  const trimmedName = name.trim();
  const existingColumn = await findColumnByName(boardId, trimmedName);

  if (existingColumn && existingColumn._id.toString() !== columnId) {
    throw new ApiError(409, "Column with this name already exists");
  }
  const updated = await updateColumnName(boardId, columnId, trimmedName);
  if (!updated) throw new ApiError(204, "Column not found");
  return updated;
};

export const deleteColumnService = async (
  requestingUserId: string,
  boardId: string,
  columnId: string
) => {
  await ensureBoardAndAdmin(requestingUserId, boardId);

  const deleted = await deleteColumnById(boardId, columnId);
  if (!deleted) throw new ApiError(204, "Column not found");

  await compactPositionsAfter(boardId, deleted.position);
  return true;
};

export const reorderColumnsService = async (
  requestingUserId: string,
  boardId: string,
  updates: Array<{ columnId: string; position: number }>
) => {
  await ensureBoardAndAdmin(requestingUserId, boardId);

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, "Updates array is required");
  }

  const finalPositions = updates.map((update) => update.position);
  if (finalPositions.some((position) => position < 0 || !Number.isInteger(position))) {
    throw new ApiError(400, "Positions must be non-negative integers");
  }

  const targetIds = updates.map((update) => new Types.ObjectId(update.columnId));
  const found = await findColumnsByIdsForBoard(boardId, targetIds);
  
  if (found.length !== updates.length) {
    throw new ApiError(400, "One or more columns do not belong to this board");
  }
  const bulkOps = updates.map(({ columnId, position }) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(columnId), boardId: new Types.ObjectId(boardId) },
      update: { $set: { position: position } },
    },
  }));

  if (bulkOps.length > 0) {
    await ColumnModel.bulkWrite(bulkOps);
  }

  return findColumnsByBoardIdSorted(boardId);
};

export const getColumn = async (
  requestingUserId: string,
  boardId: string,
  columnId: string
) => {
  await ensureBoardAndMembership(requestingUserId, boardId);

  const column = await findSingleColumnForBoard(boardId, columnId);
  if (!column) throw new ApiError(204, "Column not found");
  return column;
};
