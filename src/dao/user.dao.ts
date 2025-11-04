import { Types } from "mongoose";
import { UserModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import type { UserDocument } from "../models/user.model.js";

export async function findUserByEmail(email: string): Promise<UserDocument | null> {
  return UserModel.findOne({ email });
}

export async function findUserById(userId: string | Types.ObjectId): Promise<UserDocument | null> {
  return UserModel.findById(userId).select("-password -refreshTokenHash -refreshTokenExpiresAt");
}

export async function addBoardToUser(userId: string | Types.ObjectId, boardId: string | Types.ObjectId) {
  return UserModel.findByIdAndUpdate(userId, { $addToSet: { boards: boardId } }, { new: true });
}

export async function pullBoardFromAllUsers(boardId: string | Types.ObjectId) {
  return UserModel.updateMany({ boards: boardId }, { $pull: { boards: boardId } });
}

type CreateUserInput = {
  fullName: string;
  email: string;
  passwordHash: string;
  roles?: Array<"admin" | "user">;
};

export async function createUser(input: CreateUserInput): Promise<UserDocument> {
  const { fullName, email, passwordHash, roles = ["user"] } = input;
  return UserModel.create({
    fullName,
    email,
    password: passwordHash,
    role: roles,
  });
}

export const setRefreshTokenForUser = async (
  userId: string | Types.ObjectId,
  refreshTokenPlain: string,
  expiresAt: Date
) => {
  const refreshTokenHash = await bcrypt.hash(refreshTokenPlain, 10);
  return UserModel.findByIdAndUpdate(
    userId,
    { $set: { refreshTokenHash, refreshTokenExpiresAt: expiresAt } },
    { new: true }
  );
};

export const clearRefreshTokenForUser = (userId: string | Types.ObjectId) =>
  UserModel.findByIdAndUpdate(
    userId,
    { $set: { refreshTokenHash: null, refreshTokenExpiresAt: null } },
    { new: true }
  );

export const verifyUserRefreshToken = async (
  user: UserDocument,
  refreshTokenPlain: string
): Promise<boolean> => {
  if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) return false;
  if (user.refreshTokenExpiresAt.getTime() < Date.now()) return false;
  return bcrypt.compare(refreshTokenPlain, user.refreshTokenHash);
};
