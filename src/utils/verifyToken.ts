import { UserDocument } from "../interfaces/user";
import bcrypt from "bcryptjs";

export const verifyUserRefreshToken = async (
  user: UserDocument,
  refreshTokenPlain: string
): Promise<boolean> => {
  if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) return false;
  if (user.refreshTokenExpiresAt.getTime() < Date.now()) return false;
  return bcrypt.compare(refreshTokenPlain, user.refreshTokenHash);
};
