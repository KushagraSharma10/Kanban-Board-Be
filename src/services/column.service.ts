import mongoose, { Types } from "mongoose";
import { AnyBulkWriteOperation, ObjectId } from "mongodb";

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
} from "../dao/column.dao.js";

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

  const last = await findLastColumnInBoard(boardId);
  const position = last ? (last.position ?? 0) + 1 : 0;

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

  const updated = await updateColumnName(boardId, columnId, name.trim());
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

const TEMP_SHIFT = 10000;
export const reorderColumnsService = async (
  requestingUserId: string,
  boardId: string,
  updates: Array<{ columnId: string; position: number }>
) => {
  await ensureBoardAndAdmin(requestingUserId, boardId);

  if (!Array.isArray(updates) || updates.length === 0) {
    throw new ApiError(400, "Updates array is required");
  }

  const finalPositions = updates.map((u) => u.position);
  const uniqueFinalPositions = new Set(finalPositions);
  if (uniqueFinalPositions.size !== finalPositions.length) {
    throw new ApiError(400, "Duplicate final positions in updates");
  }
  if (finalPositions.some((p) => p < 0 || !Number.isInteger(p))) {
    throw new ApiError(400, "Positions must be non-negative integers");
  }

  const boardObjectId = new Types.ObjectId(boardId);
  const targetIds = updates.map((u) => new Types.ObjectId(u.columnId));

  const found = await findColumnsByIdsForBoard(boardId, targetIds);
  if (found.length !== updates.length) {
    throw new ApiError(400, "Invalid columns in updates");
  }

  const finalPositionById = new Map<string, number>();
  for (const { columnId, position } of updates) {
    finalPositionById.set(new Types.ObjectId(columnId).toHexString(), position);
  }

  const shiftOps: AnyBulkWriteOperation[] = updates.map(({ columnId }) => ({
    updateOne: {
      filter: { _id: new Types.ObjectId(columnId), boardId: boardObjectId },
      update: { $inc: { position: TEMP_SHIFT } },
    },
  }));

  const sortedByFinal = [...updates].sort((a, b) => a.position - b.position);
  const finalizeOps: AnyBulkWriteOperation[] = sortedByFinal.map(
    ({ columnId, position }) => ({
      updateOne: {
        filter: { _id: new Types.ObjectId(columnId), boardId: boardObjectId },
        update: { $set: { position } },
      },
    })
  );

  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    await mongoose.connection
      .collection("columns")
      .bulkWrite(shiftOps, { ordered: true, session });
    await mongoose.connection
      .collection("columns")
      .bulkWrite(finalizeOps, { ordered: true, session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction().catch(() => {});
    await mongoose.connection
      .collection("columns")
      .bulkWrite(shiftOps, { ordered: true });
    await mongoose.connection
      .collection("columns")
      .bulkWrite(finalizeOps, { ordered: true });
  } finally {
    session.endSession();
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
