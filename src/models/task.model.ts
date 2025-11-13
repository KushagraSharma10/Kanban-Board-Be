import mongoose, { Schema } from "mongoose";
import { TaskDocument } from "../interfaces/task";

const taskSchema = new Schema<TaskDocument>(
  {
    boardId: {
      type: Schema.Types.ObjectId,
      ref: "Board",
      required: true,
      index: true,
    },
    columnId: {
      type: Schema.Types.ObjectId,
      ref: "Column",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    priority: { type: String, enum: ["none", "low", "moderate", "high" , "urgent"] },
    dueDate: { type: Date },
    assigneeId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    assigneeEmail: { type: String, trim: true, default: null },
    position: { type: Number, required: true, min: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

taskSchema.index({ boardId: 1, columnId: 1, position: 1 }, { unique: true });
taskSchema.index({ boardId: 1, assigneeId: 1 });
taskSchema.index({ boardId: 1, assigneeEmail: 1 });

export const TaskModel = mongoose.model<TaskDocument>("Task", taskSchema);
