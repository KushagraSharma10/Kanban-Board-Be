import mongoose, { Schema, Document, Types } from "mongoose";

export type GlobalRole = "admin" | "user";

export interface UserDocument extends Document {
  fullName: string;
  email: string;
  password: string;
  role: GlobalRole[];
  boards: Types.ObjectId[];
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    fullName: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true },
    role: {
      type: [String],
      enum: ["admin", "user"],
      default: ["user"],
    },
    boards: [{ type: Schema.Types.ObjectId, ref: "Board" }],
    refreshTokenHash: { type: String, default: null },
    refreshTokenExpiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });

export const UserModel = mongoose.model<UserDocument>("User", userSchema);
