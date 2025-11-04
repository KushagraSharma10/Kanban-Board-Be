import { Types } from "mongoose";
import { BoardModel } from "../models/board.model.js";
import type { BoardDocument } from "../models/board.model.js";

export type CreateBoardInput = {
  name: string;
  type: string;
  color: string;
  createdBy: Types.ObjectId | string;
  creatorMember: { user: Types.ObjectId | string; roles: Array<"admin" | "user"> };
};

export const createBoardDoc = async(input: CreateBoardInput): Promise<BoardDocument> => {
  const { name, type, color, createdBy, creatorMember } = input;
  return BoardModel.create({
    name,
    type,
    color,
    createdBy,
    members: [creatorMember],
  });
}

export const findBoardsForUser = async(userId: string)=> {
  return BoardModel.find({
    $or: [{ createdBy: userId }, { "members.user": userId }],
  })
    .sort({ updatedAt: -1 })
    .lean();
}

export const findBoardById = async(boardId: string) => {
  return BoardModel.findById(boardId);
}

export const saveBoard = async(board: BoardDocument) => {
  return board.save();
}

export const deleteBoardById = async(boardId: string) => {
  return BoardModel.findByIdAndDelete(boardId);
}
