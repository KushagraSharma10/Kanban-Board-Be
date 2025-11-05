import { Types, Document } from "mongoose";

export interface ColumnDocument extends Document {
  boardId: Types.ObjectId;
  name: string;
  position: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
