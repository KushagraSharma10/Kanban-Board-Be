import { Request, Response } from "express";
import {
  register,
  login,
  getCurrentUser,
  refresh,
  logout,
} from "../../src/controllers/auth.controller.js";
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  refreshTokensService,
  logoutService,
} from "../../src/services/auth.service.js";
import type { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js";

jest.mock("../../src/services/auth.service");

const mockedRegisterService = registerUserService as jest.Mock;
const mockedLoginService = loginUserService as jest.Mock;
const mockedGetCurrentUserService = getCurrentUserService as jest.Mock;
const mockedRefreshService = refreshTokensService as jest.Mock;
const mockedLogoutService = logoutService as jest.Mock;

const getMockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.cookie = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockServiceResult = {
  user: { id: "1", email: "test@example.com" },
  accessToken: "mockAccessToken",
  refreshToken: "mockRefreshToken",
  refreshExpiresAt: new Date(Date.now() + 100000),
};

describe("AuthController", () => {
  let mockResponse: Response;
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = getMockRes();
  });

  describe("register", () => {
    it("should register successfully and set a cookie", async () => {
      const mockRequest = {
        body: {
          fullName: "Test User",
          email: "test@example.com",
          password: "password123",
        },
      } as Request;

      mockedRegisterService.mockResolvedValue(mockServiceResult);

      await register(mockRequest, mockResponse, mockNext);

      expect(mockedRegisterService).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        expect.any(String), 
        mockServiceResult.refreshToken,
        expect.objectContaining({ expires: mockServiceResult.refreshExpiresAt })
      );
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "User registered successfully",
        data: {
          user: mockServiceResult.user,
          accessToken: mockServiceResult.accessToken,
        },
      });
    });
  });

  describe("login", () => {
    it("should log in successfully and set a cookie", async () => {
      const mockRequest = {
        body: { email: "test@example.com", password: "password123" },
      } as Request;

      mockedLoginService.mockResolvedValue(mockServiceResult);

      await login(mockRequest, mockResponse, mockNext);

      expect(mockedLoginService).toHaveBeenCalledWith(mockRequest.body);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.cookie).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Logged in successfully",
        })
      );
    });
  });

  describe("getCurrentUser", () => {
    it("should return the current user's details", async () => {
      const mockRequest = {
        userId: "user-123",
      } as AuthenticatedRequest;

      const mockUser = { id: "user-123", email: "test@example.com" };

      mockedGetCurrentUserService.mockResolvedValue(mockUser);

      await getCurrentUser(mockRequest, mockResponse, mockNext);

      expect(mockedGetCurrentUserService).toHaveBeenCalledWith(mockRequest.userId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockUser,
      });
    });
  });

  describe("refresh", () => {
    it("should refresh successfully using the token from the cookie", async () => {
      const mockRequest = {
        cookies: {
          "refresh_token": "cookieRefreshToken",
        },
      } as unknown as Request;

      mockedRefreshService.mockResolvedValue(mockServiceResult);

      await refresh(mockRequest, mockResponse, mockNext);

      expect(mockedRefreshService).toHaveBeenCalledWith("cookieRefreshToken");
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.cookie).toHaveBeenCalled(); 
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ message: "Token refreshed" })
      );
    });

    it("should return 401 if no refresh token cookie is present", async () => {
      const mockRequest = {
        cookies: {}, 
      } as Request;

      await refresh(mockRequest, mockResponse, mockNext);

      expect(mockedRefreshService).not.toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        message: "No refresh token",
      });
    });
  });

  describe("logout", () => {
    it("should log out successfully and clear the cookie", async () => {
      const mockRequest = {
        userId: "user-123",
      } as AuthenticatedRequest;

      mockedLogoutService.mockResolvedValue(true);

      await logout(mockRequest, mockResponse, mockNext);

      expect(mockedLogoutService).toHaveBeenCalledWith(mockRequest.userId);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        expect.any(String), 
        expect.objectContaining({ expires: new Date(0) }) 
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Logged out",
      });
    });
  });
});