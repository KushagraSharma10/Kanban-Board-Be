import { Types } from "mongoose";
import { BoardDocument } from "../interfaces/boards";

export const isMember = (userId: string, board: BoardDocument) => {
  if (String(board.createdBy) === String(userId)) return true;
  return board.members.some((member) => String(member.user) === String(userId));
};

export const isAdmin = (userId: string, board: BoardDocument) => {
  return String(board.createdBy) === String(userId);
};

export const toObjectId = (id: string): Types.ObjectId =>
  new Types.ObjectId(id);
