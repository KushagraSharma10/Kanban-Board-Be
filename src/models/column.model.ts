import mongoose, { Schema, Document, Types } from "mongoose";
import { ColumnDocument } from "../interfaces/column";

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

columnSchema.index({ boardId: 1, name: 1 }, { unique: true });
columnSchema.index({ boardId: 1, position: 1 });

export const ColumnModel = mongoose.model<ColumnDocument>(
  "Column",
  columnSchema
);
