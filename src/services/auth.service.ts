import bcrypt from "bcryptjs";
import {
  findUserByEmail,
  createUser,
  findUserById,
  setRefreshTokenForUser,
  verifyUserRefreshToken,
  clearRefreshTokenForUser,
} from "../dao/user.dao.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import { ApiError } from "../utils/ApiError.js";
import { Types } from "mongoose";
import { LoginInput, RegisterInput } from "../types/user.js";

const computeRefreshExpiryDate = (): Date => {
  const days =
    Number(
      String(process.env.REFRESH_TOKEN_EXPIRES || "7d").replace("d", "")
    ) || 7;
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
};

export const registerUserCore = async (input: RegisterInput) => {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new ApiError(409, "Email already registered");
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  const created = await createUser({
    fullName: input.fullName,
    email: input.email,
    passwordHash,
  });

  const accessToken = signAccessToken({ userId: String(created._id) });

  const refreshToken = signRefreshToken(String(created._id));
  const refreshExpiresAt = computeRefreshExpiryDate();
  await setRefreshTokenForUser(
    created._id as Types.ObjectId,
    refreshToken,
    refreshExpiresAt
  );

  return {
    user: {
      id: String(created._id),
      fullName: created.fullName,
      email: created.email,
      role: created.role,
    },
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
};

export const loginUserCore = async (input: LoginInput) => {
  const user = await findUserByEmail(input.email);
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isPasswordValid = await bcrypt.compare(input.password, user.password);
  if (!isPasswordValid) throw new ApiError(401, "Invalid credentials");

  const accessToken = signAccessToken({ userId: String(user._id) });
  const refreshToken = signRefreshToken(String(user._id));
  const refreshExpiresAt = computeRefreshExpiryDate();
  await setRefreshTokenForUser(
    user._id as Types.ObjectId,
    refreshToken,
    refreshExpiresAt
  );

  return {
    user: {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken,
    refreshExpiresAt,
  };
};

export const getCurrentUserCore = async (userId: string) => {
  const user = await findUserById(userId);
  if (!user) throw new ApiError(204, "User not found");

  return {
    id: String(user._id),
    fullName: user.fullName,
    email: user.email,
    role: user.role,
  };
};

export const refreshTokensCore = async (refreshTokenFromCookie: string) => {
  let decoded: { userId: string; tokenId: string };
  try {
    decoded = verifyRefreshToken(refreshTokenFromCookie);
  } catch {
    throw new ApiError(401, "Invalid refresh token");
  }

  const user = await findUserById(decoded.userId);
  if (!user) throw new ApiError(401, "Invalid refresh token");

  const isValid = await verifyUserRefreshToken(user, refreshTokenFromCookie);
  if (!isValid) throw new ApiError(401, "Invalid refresh token");

  const accessToken = signAccessToken({ userId: String(user._id) });
  const newRefreshToken = signRefreshToken(String(user._id));
  const refreshExpiresAt = computeRefreshExpiryDate();
  await setRefreshTokenForUser(
    user._id as Types.ObjectId,
    newRefreshToken,
    refreshExpiresAt
  );

  return {
    user: {
      id: String(user._id),
      fullName: user.fullName,
      email: user.email,
      role: user.role,
    },
    accessToken,
    refreshToken: newRefreshToken,
    refreshExpiresAt,
  };
};

export const logoutCore = async (userId: string) => {
  await clearRefreshTokenForUser(userId);
  return true;
};
