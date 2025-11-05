import { Types } from "mongoose";
import { BoardDocument } from "../interfaces/boards";

export function isMember(userId: string, board: BoardDocument) {
  return board.members.some(member => String(member.user) === String(userId));
}

export function isAdmin(userId: string, board: BoardDocument) {
  return board.members.some(member => String(member.user) === String(userId) && member.roles?.includes("admin"));
}

export const toObjectId = (id: string): Types.ObjectId => new Types.ObjectId(id);