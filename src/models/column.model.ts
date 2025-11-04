import mongoose, { Schema, Document, Types } from "mongoose";

export interface ColumnDocument extends Document {
  boardId: Types.ObjectId;
  name: string;
  position: number;
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const columnSchema = new Schema<ColumnDocument>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    name: { type: String, required: true, trim: true },
    position: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

columnSchema.index({ boardId: 1, position: 1 }, { unique: true });

export const ColumnModel = mongoose.model<ColumnDocument>(
  "Column",
  columnSchema
);
