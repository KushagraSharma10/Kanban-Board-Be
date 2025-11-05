import { Types } from "mongoose";
import { UserModel } from "../models/user.model.js";
import bcrypt from "bcryptjs";
import { CreateUserInput } from "../types/user.js";
import { UserDocument } from "../interfaces/user.js";

export const findUserByEmail = async (
  email: string
): Promise<UserDocument | null> => {
  return UserModel.findOne({ email });
};

export const findUserById = async (
  userId: string | Types.ObjectId
): Promise<UserDocument | null> => {
  return UserModel.findById(userId).select(
    "-password -refreshTokenHash -refreshTokenExpiresAt"
  );
};

export const addBoardToUser = async (
  userId: string | Types.ObjectId,
  boardId: string | Types.ObjectId
) => {
  return UserModel.findByIdAndUpdate(
    userId,
    { $addToSet: { boards: boardId } },
    { new: true }
  );
};

export const pullBoardFromAllUsers = async(boardId: string | Types.ObjectId) => {
  return UserModel.updateMany(
    { boards: boardId },
    { $pull: { boards: boardId } }
  );
}

export const createUser = async(
  input: CreateUserInput
): Promise<UserDocument> => {
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
