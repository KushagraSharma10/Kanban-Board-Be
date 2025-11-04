import { AnyBulkWriteOperation, Types } from "mongoose";
import { ColumnModel } from "../models/column.model.js";
import type { ColumnDocument } from "../models/column.model.js";

export const countColumnsByBoardId = (boardId: string) =>
  ColumnModel.countDocuments({ boardId });

export const insertDefaultColumns = (
  boardId: string,
  userId: string,
  defaults: string[]
) =>
  ColumnModel.insertMany(
    defaults.map((name, index) => ({
      boardId: new Types.ObjectId(boardId),
      name,
      position: index,
      createdBy: new Types.ObjectId(userId),
    }))
  );

export const findColumnsByBoardIdSorted = (boardId: string) =>
  ColumnModel.find({ boardId }).sort({ position: 1 }).lean();

export const findLastColumnInBoard = (boardId: string) =>
  ColumnModel.find({ boardId }).sort({ position: -1 }).limit(1).lean();

export const createColumnDoc = (input: {
  boardId: string;
  name: string;
  position: number;
  createdBy: string;
}) =>
  ColumnModel.create({
    boardId: new Types.ObjectId(input.boardId),
    name: input.name,
    position: input.position,
    createdBy: new Types.ObjectId(input.createdBy),
  });

export const updateColumnName = (
  boardId: string,
  columnId: string,
  name: string
) =>
  ColumnModel.findOneAndUpdate(
    { _id: columnId, boardId },
    { $set: { name } },
    { new: true }
  );

export const deleteColumnById = (boardId: string, columnId: string) =>
  ColumnModel.findOneAndDelete({ _id: columnId, boardId });

export const compactPositionsAfter = (
  boardId: string,
  fromPositionExclusive: number
) =>
  ColumnModel.updateMany(
    { boardId, position: { $gt: fromPositionExclusive } },
    { $inc: { position: -1 } }
  );

export const bulkWritePositions = (
  operations: AnyBulkWriteOperation<ColumnDocument>[]
) => {
  return ColumnModel.bulkWrite(operations, { ordered: true });
};

export const findColumnsByIdsForBoard = (
  boardId: string,
  ids: Types.ObjectId[]
) =>
  ColumnModel.find({ _id: { $in: ids }, boardId })
    .select("_id")
    .lean();

export const findSingleColumnForBoard = (boardId: string, columnId: string) =>
  ColumnModel.findOne({ _id: columnId, boardId });
