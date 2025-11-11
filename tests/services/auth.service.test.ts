import {
  registerUserService,
  loginUserService,
  getCurrentUserService,
  refreshTokensService,
  logoutService,
} from "../../src/services/auth.service.js";
import {
  findUserByEmail,
  createUser,
  findUserById,
  setRefreshTokenForUser,
  clearRefreshTokenForUser,
} from "../../src/dao/user.dao.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../src/utils/jwt.js";
import { verifyUserRefreshToken } from "../../src/utils/verifyToken.js";
import { hash, compare } from "bcryptjs";
import { ApiError } from "../../src/utils/ApiError.js";
import { UserDocument } from "../../src/interfaces/user.js";
import { Types } from "mongoose";

jest.mock("../../src/dao/user.dao");
jest.mock("../../src/utils/jwt");
jest.mock("../../src/utils/verifyToken");
jest.mock("bcryptjs");

const mockedFindUserByEmail = findUserByEmail as jest.Mock;
const mockedFindUserById = findUserById as jest.Mock;
const mockedCreateUser = createUser as jest.Mock;
const mockedSetRefreshToken = setRefreshTokenForUser as jest.Mock;
const mockedClearRefreshToken = clearRefreshTokenForUser as jest.Mock;
const mockedSignAccessToken = signAccessToken as jest.Mock;
const mockedSignRefreshToken = signRefreshToken as jest.Mock;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.Mock;
const mockedVerifyUserToken = verifyUserRefreshToken as jest.Mock;
const mockedHash = hash as jest.Mock;
const mockedCompare = compare as jest.Mock;

const mockUserId = new Types.ObjectId().toHexString();
const mockUser: Partial<UserDocument> = {
  _id: mockUserId,
  fullName: "Test User",
  email: "test@example.com",
  password: "hashedPassword123",
  role: ["user"],
};

describe("AuthService", () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("registerUserService", () => {
    const registerInput = {
      fullName: "Test User",
      email: "test@example.com",
      password: "password123",
    };

    it("should successfully register a new user", async () => {
      mockedFindUserByEmail.mockResolvedValue(null);
      mockedHash.mockResolvedValue("hashedPassword123");
      mockedCreateUser.mockResolvedValue(mockUser as UserDocument);
      mockedSignAccessToken.mockReturnValue("mockAccessToken");
      mockedSignRefreshToken.mockReturnValue("mockRefreshToken");
      mockedSetRefreshToken.mockResolvedValue(true);

      const result = await registerUserService(registerInput);

      expect(mockedFindUserByEmail).toHaveBeenCalledWith(registerInput.email);
      expect(mockedHash).toHaveBeenCalledWith(registerInput.password, 10);
      expect(mockedCreateUser).toHaveBeenCalledWith({
        fullName: registerInput.fullName,
        email: registerInput.email,
        passwordHash: "hashedPassword123",
      });
      expect(mockedSetRefreshToken).toHaveBeenCalledWith(
        mockUserId,
        "mockRefreshToken",
        expect.any(Date) 
      );
      expect(result.accessToken).toBe("mockAccessToken");
      expect(result.user.email).toBe(registerInput.email);
    });

    it("should throw a 409 ApiError if the email is already registered", async () => {
      mockedFindUserByEmail.mockResolvedValue(mockUser as UserDocument);

      await expect(registerUserService(registerInput)).rejects.toThrow(ApiError);
      await expect(registerUserService(registerInput)).rejects.toMatchObject({
        statusCode: 409,
      });
    });
  });

  describe("loginUserService", () => {
    const loginInput = {
      email: "test@example.com",
      password: "password123",
    };

    it("should successfully log in with correct credentials", async () => {
      mockedFindUserByEmail.mockResolvedValue(mockUser as UserDocument);
      mockedCompare.mockResolvedValue(true); 
      mockedSignAccessToken.mockReturnValue("newMockAccessToken");
      mockedSignRefreshToken.mockReturnValue("newMockRefreshToken");
      mockedSetRefreshToken.mockResolvedValue(true);

      const result = await loginUserService(loginInput);

      expect(mockedFindUserByEmail).toHaveBeenCalledWith(loginInput.email);
      expect(mockedCompare).toHaveBeenCalledWith(
        loginInput.password,
        mockUser.password
      );
      expect(mockedSetRefreshToken).toHaveBeenCalledWith(
        mockUserId,
        "newMockRefreshToken",
        expect.any(Date)
      );
      expect(result.accessToken).toBe("newMockAccessToken");
      expect(result.user.id).toBe(mockUserId);
    });

    it("should throw a 401 ApiError if the user is not found", async () => {
      mockedFindUserByEmail.mockResolvedValue(null);

      await expect(loginUserService(loginInput)).rejects.toThrow(ApiError);
      await expect(loginUserService(loginInput)).rejects.toMatchObject({
        statusCode: 401,
      });
    });

    it("should throw a 401 ApiError for an incorrect password", async () => {
      mockedFindUserByEmail.mockResolvedValue(mockUser as UserDocument);
      mockedCompare.mockResolvedValue(false); 

      await expect(loginUserService(loginInput)).rejects.toThrow(ApiError);
      await expect(loginUserService(loginInput)).rejects.toMatchObject({
        statusCode: 401,
      });
    });
  });
  

  describe("getCurrentUserService", () => {
     it("should return user details for a valid user ID", async () => {
        mockedFindUserById.mockResolvedValue(mockUser as UserDocument);
        
        const user = await getCurrentUserService(mockUserId);
        
        expect(mockedFindUserById).toHaveBeenCalledWith(mockUserId);
        expect(user.id).toBe(mockUserId);
        expect(user.email).toBe(mockUser.email);
     });
     
     it("should throw a 204 ApiError for an invalid user ID", async () => {
        mockedFindUserById.mockResolvedValue(null);
        
        await expect(getCurrentUserService("invalidId")).rejects.toThrow(ApiError);
        await expect(getCurrentUserService("invalidId")).rejects.toMatchObject({
          statusCode: 204,
        });
     });
  });
  
  describe("refreshTokensService", () => {
    const mockRefreshToken = "validRefreshToken";
    const decodedToken = { userId: mockUserId, tokenId: "some-token-id" };

    it("should generate new tokens for a valid refresh token", async () => {

        mockedVerifyRefreshToken.mockReturnValue(decodedToken);
        mockedFindUserById.mockResolvedValue(mockUser as UserDocument);
        mockedVerifyUserToken.mockResolvedValue(true);
        mockedSignAccessToken.mockReturnValue("newestAccessToken");
        mockedSignRefreshToken.mockReturnValue("newestRefreshToken");
        mockedSetRefreshToken.mockResolvedValue(true);
        
        const result = await refreshTokensService(mockRefreshToken);
        
        expect(mockedVerifyRefreshToken).toHaveBeenCalledWith(mockRefreshToken);
        expect(mockedFindUserById).toHaveBeenCalledWith(decodedToken.userId);
        expect(mockedVerifyUserToken).toHaveBeenCalledWith(mockUser, mockRefreshToken);
        expect(mockedSetRefreshToken).toHaveBeenCalledWith(mockUserId, "newestRefreshToken", expect.any(Date));
        expect(result.accessToken).toBe("newestAccessToken");
        expect(result.user.id).toBe(mockUserId);
    });
    
    it("should throw a 401 ApiError for an invalid/tampered token (verification fail)", async () => {
        mockedVerifyRefreshToken.mockImplementation(() => {
            throw new Error("Invalid token");
        });
        
        await expect(refreshTokensService("badToken")).rejects.toThrow(ApiError);
        await expect(refreshTokensService("badToken")).rejects.toMatchObject({
            statusCode: 401,
        });
    });
    
     it("should throw a 401 ApiError if the user is not in the DB", async () => {
        mockedVerifyRefreshToken.mockReturnValue(decodedToken);
        mockedFindUserById.mockResolvedValue(null); 
        
        await expect(refreshTokensService(mockRefreshToken)).rejects.toThrow(ApiError);
        await expect(refreshTokensService(mockRefreshToken)).rejects.toMatchObject({
            statusCode: 401,
        });
    });
    
    it("should throw a 401 ApiError if the token hash does not match the one in DB", async () => {
        mockedVerifyRefreshToken.mockReturnValue(decodedToken);
        mockedFindUserById.mockResolvedValue(mockUser as UserDocument);
        mockedVerifyUserToken.mockResolvedValue(false); 
        
        await expect(refreshTokensService(mockRefreshToken)).rejects.toThrow(ApiError);
        await expect(refreshTokensService(mockRefreshToken)).rejects.toMatchObject({
            statusCode: 401,
        });
    });
  });
  

  describe("logoutService", () => {
    it("should clear the user's refresh token", async () => {
        mockedClearRefreshToken.mockResolvedValue(true);
        
        await logoutService(mockUserId);
        
        expect(mockedClearRefreshToken).toHaveBeenCalledWith(mockUserId);
    });
  });
});