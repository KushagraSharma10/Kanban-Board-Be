import request from "supertest";
import app from "../../src/app.js"; 
import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js"; 
import { BoardModel } from "../../src/models/board.model.js";
import { UserModel } from "../../src/models/user.model.js";

describe("Board E2E Tests", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  const userAData = {
    fullName: "User A",
    email: "usera@e2e.com",
    password: "Password123!",
  };
  const userBData = {
    fullName: "User B",
    email: "userb@e2e.com",
    password: "Password123!",
  };

  const getAuthToken = async (
    userData = userAData
  ): Promise<{ token: string; userId: string }> => {
    await request(app).post("/auth/register").send(userData);
    const loginResponse = await request(app)
      .post("/auth/login")
      .send({ email: userData.email, password: userData.password });
    return {
      token: loginResponse.body.data.accessToken,
      userId: loginResponse.body.data.user.id,
    };
  };

  describe("As an authenticated user", () => {
    let tokenA: string;
    let userIdA: string;
    let tokenB: string;

    beforeEach(async () => {
      const authA = await getAuthToken(userAData);
      tokenA = authA.token;
      userIdA = authA.userId;
      
      const authB = await getAuthToken(userBData);
      tokenB = authB.token;
    });

    it("should allow a user to create, get, update, and delete their own board", async () => {
      const boardInput = {
        name: "My E2E Board",
        type: "General",
        color: "#123456",
      };

      const createResponse = await request(app)
        .post("/boards")
        .set("Authorization", `Bearer ${tokenA}`)
        .send(boardInput);

      expect(createResponse.status).toBe(201);
      expect(createResponse.body.data.name).toBe(boardInput.name);
      const boardId = createResponse.body.data._id;

      const dbBoard = await BoardModel.findById(boardId);
      expect(dbBoard).toBeDefined();
      expect(dbBoard?.createdBy.toHexString()).toBe(userIdA);
      
      const dbUser = await UserModel.findById(userIdA);
      expect(dbUser?.boards[0].toHexString()).toBe(boardId);

      const listResponse = await request(app)
        .get("/boards")
        .set("Authorization", `Bearer ${tokenA}`);
      
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0]._id).toBe(boardId);

      const getResponse = await request(app)
        .get(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      
      expect(getResponse.status).toBe(200);
      expect(getResponse.body.data.name).toBe(boardInput.name);

      const updateInput = { name: "Updated E2E Name" };
      const updateResponse = await request(app)
        .patch(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenA}`)
        .send(updateInput);
      
      expect(updateResponse.status).toBe(200);
      expect(updateResponse.body.data.name).toBe(updateInput.name);

      const deleteResponse = await request(app)
        .delete(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      
      expect(deleteResponse.status).toBe(200);
      expect(deleteResponse.body.message).toBe("Board deleted");

      const verifyResponse = await request(app)
        .get(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenA}`);
      
      expect(verifyResponse.status).toBe(204); 
    });

    it("should NOT allow a user to get, update, or delete another user's board", async () => {
      const boardInput = { name: "User A's Board", type: "Engineering", color: "#aaa" };
      const createResponse = await request(app)
        .post("/boards")
        .set("Authorization", `Bearer ${tokenA}`)
        .send(boardInput);
        
      const boardId = createResponse.body.data._id;

      const getResponse = await request(app)
        .get(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenB}`); 
      
      expect(getResponse.status).toBe(403); 

      const updateResponse = await request(app)
        .patch(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ name: "Hacked" });
        
      expect(updateResponse.status).toBe(403); 

      const deleteResponse = await request(app)
        .delete(`/boards/${boardId}`)
        .set("Authorization", `Bearer ${tokenB}`); 
      
      expect(deleteResponse.status).toBe(403); 
    });
  });
});