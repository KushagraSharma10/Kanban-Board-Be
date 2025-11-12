import { Document, Types } from "mongoose";
import { GlobalRole } from "../types/user";

export interface UserDocument extends Document {
  fullName: string;
  email: string;
  password?: string;
  role: GlobalRole[];
  boards: Types.ObjectId[];
  refreshTokenHash?: string | null;
  refreshTokenExpiresAt?: Date | null;
  googleId?: string;
  avatar?: string;
  createdAt: Date;
  updatedAt: Date;
}
