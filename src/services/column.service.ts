import { AnyBulkWriteOperation, Types } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { isMember } from "../utils/boardAuth.js";
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
  bulkWritePositions,
} from "../dao/column.dao.js";
import { ColumnDocument } from "../models/column.model.js";

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

export const listColumnsForBoard = async (
  requestingUserId: string,
  boardId: string
) => {
  await ensureBoardAndMembership(requestingUserId, boardId);

  const existingCount = await countColumnsByBoardId(boardId);
  if (existingCount === 0) {
    await insertDefaultColumns(boardId, requestingUserId, [
      "To Do",
      "In Progress",
      "Done",
    ]);
  }
  return findColumnsByBoardIdSorted(boardId);
};

export const createColumnCore = async (
  requestingUserId: string,
  boardId: string,
  name: string
) => {
  if (!name || name.trim() === "")
    throw new ApiError(400, "Column name is required");

  await ensureBoardAndMembership(requestingUserId, boardId);

  const last = await findLastColumnInBoard(boardId);
  const position = last.length ? (last[0].position ?? 0) + 1 : 0;

  return createColumnDoc({
    boardId,
    name: name.trim(),
    position,
    createdBy: requestingUserId,
  });
};

export const updateColumnCore = async (
  requestingUserId: string,
  boardId: string,
  columnId: string,
  name: string
) => {
  if (!name || name.trim() === "")
    throw new ApiError(400, "Column name is required");

  await ensureBoardAndMembership(requestingUserId, boardId);

  const updated = await updateColumnName(boardId, columnId, name.trim());
  if (!updated) throw new ApiError(204, "Column not found");
  return updated;
};

export const deleteColumnCore = async (
  requestingUserId: string,
  boardId: string,
  columnId: string
) => {
  await ensureBoardAndMembership(requestingUserId, boardId);

  const deleted = await deleteColumnById(boardId, columnId);
  if (!deleted) throw new ApiError(204, "Column not found");

  await compactPositionsAfter(boardId, deleted.position);
  return true;
};

export const reorderColumnsCore = async (
  requestingUserId: string,
  boardId: string,
  updates: Array<{ columnId: string; position: number }>
) => {
  await ensureBoardAndMembership(requestingUserId, boardId);

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, "Updates array is required");
  }

  const boardObjectId = new Types.ObjectId(boardId);

  const ids = updates.map((update) => new Types.ObjectId(update.columnId));
  const found = await findColumnsByIdsForBoard(boardId, ids);
  if (found.length !== updates.length)
    throw new ApiError(400, "Invalid columns in updates");

  const ops: AnyBulkWriteOperation<ColumnDocument>[] = updates.map((u) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(u.columnId), boardId: boardObjectId },
      update: { $set: { position: u.position } },
    },
  }));

   await bulkWritePositions(ops);
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
