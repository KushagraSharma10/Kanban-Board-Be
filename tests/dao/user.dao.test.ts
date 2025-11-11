import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js"; 
import { UserModel } from "../../src/models/user.model.js";
import * as UserDAO from "../../src/dao/user.dao.js";
import { Types } from "mongoose";
import bcrypt from "bcryptjs";

describe("UserDAO ", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  const userData = {
    fullName: "DAO Test User",
    email: "dao@test.com",
    passwordHash: "someHashedPassword",
  };

  describe("createUser", () => {
    it("should create and save a new user successfully", async () => {
      const createdUser = await UserDAO.createUser(userData);


      expect(createdUser).toBeDefined();
      expect(createdUser.email).toBe(userData.email);
      expect(createdUser.password).toBe(userData.passwordHash);
      expect(createdUser.role).toEqual(["user"]); 

      const dbUser = await UserModel.findById(createdUser._id);
      expect(dbUser).toBeDefined();
      expect(dbUser?.email).toBe(userData.email);
    });
  });


  describe("findUserByEmail", () => {
    it("should find a user by their email", async () => {
      await UserDAO.createUser(userData);
      const foundUser = await UserDAO.findUserByEmail(userData.email);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
    });

    it("should return null if no user is found", async () => {
      const foundUser = await UserDAO.findUserByEmail("nonexistent@test.com");
      expect(foundUser).toBeNull();
    });
  });

  describe("findUserById", () => {
    it("should find a user by ID and exclude the password", async () => {
      const createdUser = await UserDAO.createUser(userData);
      const foundUser = await UserDAO.findUserById(createdUser._id as Types.ObjectId);

      expect(foundUser).toBeDefined();
      expect(foundUser?.email).toBe(userData.email);
      expect(foundUser?.password).toBeUndefined();
    });
  });

  describe("setRefreshTokenForUser", () => {
    it("should hash and set the refresh token and expiry date", async () => {
      const createdUser = await UserDAO.createUser(userData);
      const plainToken = "my-plain-refresh-token";
      const expiryDate = new Date(Date.now() + 100000);

      await UserDAO.setRefreshTokenForUser(
        createdUser._id as Types.ObjectId,
        plainToken,
        expiryDate
      );

      const updatedUser = await UserModel.findById(createdUser._id);
      expect(updatedUser?.refreshTokenHash).toBeDefined();
      expect(updatedUser?.refreshTokenHash).not.toBe(plainToken);
      expect(updatedUser?.refreshTokenExpiresAt).toEqual(expiryDate);

      const isMatch = await bcrypt.compare(
        plainToken,
        updatedUser?.refreshTokenHash!
      );
      expect(isMatch).toBe(true);
    });
  });
  
 
  describe("clearRefreshTokenForUser", () => {
    it("should set refresh token fields to null", async () => {
       const createdUser = await UserDAO.createUser(userData);
       await UserDAO.setRefreshTokenForUser(createdUser._id as Types.ObjectId, "token", new Date());
       
       await UserDAO.clearRefreshTokenForUser(createdUser._id as Types.ObjectId);
       
       const updatedUser = await UserModel.findById(createdUser._id);
       expect(updatedUser?.refreshTokenHash).toBeNull();
       expect(updatedUser?.refreshTokenExpiresAt).toBeNull();
    });
  });

  describe("addBoardToUser", () => {
    it("should add a board ID to the user's boards array", async () => {
      const createdUser = await UserDAO.createUser(userData);
      const boardId = new Types.ObjectId();

      await UserDAO.addBoardToUser(createdUser._id as Types.ObjectId, boardId);

      const updatedUser = await UserModel.findById(createdUser._id);
      expect(updatedUser?.boards).toBeDefined();
      expect(updatedUser?.boards).toHaveLength(1);
      expect(updatedUser?.boards[0]).toEqual(boardId);
    });
  });
  

  describe("pullBoardFromAllUsers", () => {
     it("should remove the board ID from all users who have it", async () => {
        const boardId = new Types.ObjectId();
        
        const user1 = await UserDAO.createUser(userData);
        const user2 = await UserDAO.createUser({ ...userData, email: "user2@test.com" });
        await UserDAO.addBoardToUser(user1._id as Types.ObjectId, boardId);
        await UserDAO.addBoardToUser(user2._id as Types.ObjectId, boardId);
        
        await UserDAO.pullBoardFromAllUsers(boardId);
        
        const updatedUser1 = await UserModel.findById(user1._id);
        const updatedUser2 = await UserModel.findById(user2._id);
        
        expect(updatedUser1?.boards).toHaveLength(0);
        expect(updatedUser2?.boards).toHaveLength(0);
     });
  });
});