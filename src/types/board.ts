import { Types } from "mongoose";
import { BoardMember } from "../interfaces/boards";

export type CreateBoardInput = {
  name: string;
  type: string;
  color: string;
  createdBy: Types.ObjectId | string;
  members?: BoardMember[],
};

export type BoardMemberRole = "admin" | "user";
