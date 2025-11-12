import request from "supertest";
import app from "../../src/app.js";
import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js";
import { ColumnModel } from "../../src/models/column.model.js";

const getAuthToken = async (email: string, password: string) => {
  const res = await request(app)
    .post("/auth/login")
    .send({ email, password });
  return res.body.data.accessToken;
};

describe("Column E2E Tests", () => {
  beforeAll(async () => {
    await connectTestDB();
  });
  beforeEach(async () => {
    await dropTestDB();
  });
  afterAll(async () => {
    await disconnectTestDB();
  });

  const userA = { fullName: "User A", email: "a@col.com", password: "Password123!" };
  
  it("should handle column lifecycle: create, list, reorder, delete", async () => {
    await request(app).post("/auth/register").send(userA);
    const token = await getAuthToken(userA.email, userA.password);

    const boardRes = await request(app)
      .post("/boards")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Col Board", type: "General", color: "#fff" });
    
    const boardId = boardRes.body.data._id;

    const listRes = await request(app)
      .get(`/${boardId}/columns`) 
      .set("Authorization", `Bearer ${token}`);

    expect(listRes.status).toBe(200);
    expect(listRes.body.data.length).toBeGreaterThan(0); 
    const defaultColId = listRes.body.data[0]._id;

    const createRes = await request(app)
      .post(`/${boardId}/columns`) 
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Custom Col" });
    
    expect(createRes.status).toBe(201);
    const customColId = createRes.body.data._id;

    const updates = [
      { columnId: customColId, position: 0 },
      { columnId: defaultColId, position: 1 }
    ];

    const reorderRes = await request(app)
      .patch(`/${boardId}/columns/reorder`) 
      .set("Authorization", `Bearer ${token}`)
      .send({ updates });
      
    expect(reorderRes.status).toBe(200);
    expect(reorderRes.body.data[0]._id).toBe(customColId);

    const deleteRes = await request(app)
      .delete(`/${boardId}/columns/${customColId}`) 
      .set("Authorization", `Bearer ${token}`);
      
    expect(deleteRes.status).toBe(200);

    const dbCol = await ColumnModel.findById(customColId);
    expect(dbCol).toBeNull();
  });

  it("should prevent non-members from accessing columns", async () => {
    await request(app).post("/auth/register").send(userA);
    const tokenA = await getAuthToken(userA.email, userA.password);
    
    const boardRes = await request(app)
      .post("/boards")
      .set("Authorization", `Bearer ${tokenA}`)
      .send({ name: "Private Board", type: "General", color: "#000" });
    const boardId = boardRes.body.data._id;

    const userB = { fullName: "User B", email: "b@col.com", password: "Password123!" };
    await request(app).post("/auth/register").send(userB);
    const tokenB = await getAuthToken(userB.email, userB.password);

    const failRes = await request(app)
      .get(`/${boardId}/columns`)
      .set("Authorization", `Bearer ${tokenB}`);
      
    expect(failRes.status).toBe(403); 
  });
});