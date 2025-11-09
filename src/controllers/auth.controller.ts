import { Request, Response } from "express";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  refreshTokensService,
  logoutService,
} from "../services/auth.service.js";
import type { AuthenticatedRequest } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { REFRESH_COOKIE_NAME, refreshCookieOptions } from "../utils/jwt.js";

export const register = asyncHandler(async (req: Request, res: Response) => { 
  const { fullName, email, password } = req.body;
  const result = await registerUserService({ fullName, email, password });

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...refreshCookieOptions,
    expires: result.refreshExpiresAt,
  });

  res.status(201).json({
    success: true,
    message: "User registered successfully",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await loginUserService({ email, password });
  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...refreshCookieOptions,
    expires: result.refreshExpiresAt,
  });

  res.status(200).json({
    success: true,
    message: "Logged in successfully",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const getCurrentUser = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const userId = req.userId!;
    const user = await getCurrentUserService(userId);
    res.status(200).json({ success: true, data: user });
  }
);

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const tokenFromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  if (!tokenFromCookie) {
    res.status(401).json({ success: false, message: "No refresh token" });
    return;
  }

  const result = await refreshTokensService(tokenFromCookie);

  res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, {
    ...refreshCookieOptions,
    expires: result.refreshExpiresAt,
  });

  res.status(200).json({
    success: true,
    message: "Token refreshed",
    data: { user: result.user, accessToken: result.accessToken },
  });
});

export const logout = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    await logoutService(req.userId!);
    res.clearCookie(REFRESH_COOKIE_NAME, {
      ...refreshCookieOptions,
      expires: new Date(0),
    });
    res.status(200).json({ success: true, message: "Logged out" });
  }
);
