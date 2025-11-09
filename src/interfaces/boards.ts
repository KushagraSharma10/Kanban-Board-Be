import { Document, Types } from "mongoose";
import { BoardMemberRole } from "../types/board";

export interface Board {
    id: string;
    name: string;
    color: string;
}
export interface BoardMember {
  user: Types.ObjectId;
  roles: BoardMemberRole[];
}

export interface BoardDocument extends Document {
  name: string;
  color: string;
  type: string;
  createdBy: Types.ObjectId;
  members: BoardMember[];
  createdAt: Date;
  updatedAt: Date;
}
