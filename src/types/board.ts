import { Types } from "mongoose";

export type CreateBoardInput = {
  name: string;
  type: string;
  color: string;
  createdBy: Types.ObjectId | string;
  creatorMember: { user: Types.ObjectId | string; roles: Array<"admin" | "user"> };
};

export type BoardMemberRole = "admin" | "user";
