import { BoardDocument } from "../interfaces/boards.js";
import { BoardModel } from "../models/board.model.js";
import { CreateBoardInput } from "../types/board.js";

export const createBoardDoc = async(input: CreateBoardInput): Promise<BoardDocument> => {
  const { name, type, color, createdBy, members = [] } = input;
  return BoardModel.create({
    name,
    type,
    color,
    createdBy,
    members,
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
