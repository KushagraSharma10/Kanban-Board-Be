import mongoose, { Schema, Document, Types } from "mongoose";

export type BoardMemberRole = "admin" | "user";

export interface BoardMember {
  user: Types.ObjectId;
  roles: BoardMemberRole[];
}

export interface BoardDocument extends Document {
  name: string;
  color?: string;
  type?: string;
  createdBy: Types.ObjectId;
  members: BoardMember[];
  createdAt: Date;
  updatedAt: Date;
}

const boardMemberSchema = new Schema<BoardMember>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    roles: {
      type: [String],
      enum: ["admin", "user"],
      default: ["user"],
    },
  },
  { _id: false }
);

const boardSchema = new Schema<BoardDocument>(
  {
    name: { type: String, required: true, trim: true },
    color: { type: String, required: true, trim: true },
    type: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [boardMemberSchema], default: [] },
  },
  { timestamps: true }
);

boardSchema.index({ createdBy: 1, name: 1 }, );
boardSchema.index({ "members.user": 1 });

export const BoardModel = mongoose.model<BoardDocument>("Board", boardSchema);
