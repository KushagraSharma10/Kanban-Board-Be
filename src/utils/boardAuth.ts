import { Types } from "mongoose";
import { BoardDocument } from "../interfaces/boards";

export const isMember = (userId: string, board: BoardDocument) => {
  return board.members.some(member => String(member.user) === String(userId));
}

export const isAdmin = (userId: string, board: BoardDocument) => {
  return board.members.some(member => String(member.user) === String(userId) && member.roles?.includes("admin"));
}

export const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);