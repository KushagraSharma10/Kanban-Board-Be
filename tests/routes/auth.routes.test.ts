import request from "supertest";
import app from "../../src/app.js"; 
import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  refreshTokensService,
  logoutService,
} from "../../src/services/auth.service.js";
import { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js";
import { NextFunction } from "express";
import Joi from "joi";


const REFRESH_COOKIE = "refresh_token";

jest.mock("../../src/services/auth.service");


jest.mock("../../src/middlewares/requireAuth.js", () => ({
  requireAuth: (
 
    req: AuthenticatedRequest,
    _res: Response, 
    next: NextFunction
  ) => {
    req.userId = "mock-user-id-from-middleware"; 
    next();
  },
}));

jest.mock("../../src/middlewares/validate.middleware.js", () => ({
  validate: (_schema:Joi.Schema) => ( 
  
    _req: Request, 
    _res: Response, 
    next: NextFunction
  ) => {
    next();
  },
}));

const mockedRegisterService = registerUserService as jest.Mock;
const mockedLoginService = loginUserService as jest.Mock;
const mockedGetCurrentUserService = getCurrentUserService as jest.Mock;
const mockedRefreshService = refreshTokensService as jest.Mock;
const mockedLogoutService = logoutService as jest.Mock;

const mockServiceResult = {
  user: { id: "1", email: "test@example.com" },
  accessToken: "mockAccessToken",
  refreshToken: "mockRefreshToken",
  refreshExpiresAt: new Date(Date.now() + 100000),
};

describe("Auth Routes ", () => {
  beforeEach(() => {
    jest.clearAllMocks(); 
  });

  describe("POST /auth/register", () => {
    it("should call registerUserService and return 201", async () => {
      const registerInput = {
        fullName: "Test",
        email: "test@reg.com",
        password: "pass",
      };
      mockedRegisterService.mockResolvedValue(mockServiceResult);

      const response = await request(app)
        .post("/auth/register")
        .send(registerInput);

      expect(mockedRegisterService).toHaveBeenCalledWith(registerInput);
      expect(response.status).toBe(201);
      expect(response.body.data.accessToken).toBe(mockServiceResult.accessToken);
      expect(response.headers["set-cookie"]).toBeDefined();
    });
  });

  describe("POST /auth/login", () => {
    it("should call loginUserService and return 200", async () => {
      const loginInput = { email: "test@login.com", password: "pass" };
      mockedLoginService.mockResolvedValue(mockServiceResult);

      const response = await request(app)
        .post("/auth/login")
        .send(loginInput);

      expect(mockedLoginService).toHaveBeenCalledWith(loginInput);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged in successfully");
    });
  });

  describe("GET /auth/user", () => {
    it("should call getCurrentUserService and return user", async () => {
      const mockUser = { id: "mock-user-id-from-middleware", email: "mock@user.com" };
      mockedGetCurrentUserService.mockResolvedValue(mockUser);

      const response = await request(app)
        .get("/auth/user")
        .set("Authorization", "Bearer fake-token");

      expect(mockedGetCurrentUserService).toHaveBeenCalledWith(
        "mock-user-id-from-middleware"
      );
      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(mockUser);
    });
  });

  describe("POST /auth/refresh", () => {
    it("should call refreshTokensService with cookie token and return 200", async () => {
      const cookieToken = "my-cookie-token";
      
      mockedRefreshService.mockResolvedValue(mockServiceResult);

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", `${REFRESH_COOKIE}=${cookieToken}`);
        
      expect(mockedRefreshService).toHaveBeenCalledWith(cookieToken);
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Token refreshed");
    });
    
    it("should return 401 if no refresh token cookie is provided", async () => {
      const response = await request(app)
        .post("/auth/refresh");
        
      expect(mockedRefreshService).not.toHaveBeenCalled();
      expect(response.status).toBe(401);
      expect(response.body.message).toBe("No refresh token");
    });
  });

  describe("POST /auth/logout", () => {
    it("should call logoutService and clear cookie", async () => {
      mockedLogoutService.mockResolvedValue(true);

      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", "Bearer fake-token");

      expect(mockedLogoutService).toHaveBeenCalledWith("mock-user-id-from-middleware");
      expect(response.status).toBe(200);
      expect(response.body.message).toBe("Logged out");
      const clearedCookie = response.headers["set-cookie"]?.[0];
      expect(clearedCookie).toContain("Expires=Thu, 01 Jan 1970");
    });
  });
});