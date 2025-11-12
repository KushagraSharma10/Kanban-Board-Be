import request from "supertest";
import app from "../../src/app.js";
import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js";
import { TaskModel } from "../../src/models/task.model.js";

const getAuthToken = async (email: string, password: string) => {
  const res = await request(app).post("/auth/login").send({ email, password });
  return res.body.data.accessToken;
};

describe("Task E2E Tests", () => {
  beforeAll(async () => { await connectTestDB(); });
  beforeEach(async () => { await dropTestDB(); });
  afterAll(async () => { await disconnectTestDB(); });

  const userA = { fullName: "User A", email: "task@test.com", password: "Password123!" };

  it("should create, list, update, and delete a task", async () => {
    await request(app).post("/auth/register").send(userA);
    const token = await getAuthToken(userA.email, userA.password);

    const boardRes = await request(app)
      .post("/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Task Board", type: "General", color: "#fff" });
    const boardId = boardRes.body.data._id;

    const colRes = await request(app)
      .post(`/${boardId}/columns`)
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Todo" });
    const columnId = colRes.body.data._id;

    const taskRes = await request(app)
      .post(`/${boardId}/columns/${columnId}/tasks`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "My First Task", priority: "high" });

    expect(taskRes.status).toBe(201);
    expect(taskRes.body.data.title).toBe("My First Task");
    const taskId = taskRes.body.data._id;

    const listRes = await request(app)
      .get(`/${boardId}/columns/${columnId}/tasks`)
      .set("Authorization", `Bearer ${token}`);
    
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const updateRes = await request(app)
      .patch(`/${boardId}/columns/${columnId}/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "Updated Task", priority: "moderate" });
      
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.data.title).toBe("Updated Task");

    const deleteRes = await request(app)
      .delete(`/${boardId}/columns/${columnId}/tasks/${taskId}`)
      .set("Authorization", `Bearer ${token}`);
      
    expect(deleteRes.status).toBe(200);
    
    const dbTask = await TaskModel.findById(taskId);
    expect(dbTask).toBeNull();
  });
});