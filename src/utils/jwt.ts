import jwt, { SignOptions } from "jsonwebtoken";
import { randomUUID } from "node:crypto";

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET as string;
const ACCESS_TOKEN_EXPIRES = (process.env.ACCESS_TOKEN_EXPIRES || "15m") as jwt.SignOptions["expiresIn"];

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;
const REFRESH_TOKEN_EXPIRES = (process.env.REFRESH_TOKEN_EXPIRES || "7d") as jwt.SignOptions["expiresIn"];

export type AccessPayload = { userId: string };
export type RefreshPayload = { userId: string; tokenId: string };

export const signAccessToken = (payload: AccessPayload): string => {
  const options: SignOptions = { expiresIn: ACCESS_TOKEN_EXPIRES };
  return jwt.sign(payload, JWT_ACCESS_SECRET, options);
};

export const verifyAccessToken = (token: string): AccessPayload =>
  jwt.verify(token, JWT_ACCESS_SECRET) as AccessPayload;

export const signRefreshToken = (userId: string): string => {
  const options: SignOptions = { expiresIn: REFRESH_TOKEN_EXPIRES };
  const payload: RefreshPayload = { userId, tokenId: randomUUID() };
  return jwt.sign(payload, JWT_REFRESH_SECRET, options);
};

export const verifyRefreshToken = (token: string): RefreshPayload =>
  jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;

export const REFRESH_COOKIE_NAME = "refresh_token";

export const refreshCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/auth/refresh",
};
