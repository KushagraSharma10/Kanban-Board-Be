import request from "supertest"; 
import { connectTestDB, dropTestDB, disconnectTestDB } from "../testDb.js"; 
import { UserModel } from "../../src/models/user.model.js";
import app from "../../src/app.js";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const REFRESH_COOKIE = "refresh_token";

describe("Auth E2E Tests", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  const testUser = {
    fullName: "E2E Test User",
    email: "e2e@test.com",
    password: "Password123!",
  };

  const getRefreshTokenFromCookie = (
    cookieHeader: string | string[] | undefined
  ): string | undefined => {
    if (!cookieHeader) {
      return undefined;
    }

    const cookies = Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];

    const refreshCookie = cookies.find((cookie) =>
      cookie.startsWith(`${REFRESH_COOKIE}=`)
    );

    return refreshCookie?.split(";")[0].split("=")[1];
  };

  describe("POST /auth/register", () => {
    it("should register a new user, return 201, and provide tokens", async () => {
      const response = await request(app).post("/auth/register").send(testUser);

      expect(response.status).toBe(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(testUser.email);
      expect(response.body.data.accessToken).toBeDefined();

      const dbUser = await UserModel.findOne({ email: testUser.email });
      expect(dbUser).toBeDefined();
      expect(dbUser?.fullName).toBe(testUser.fullName);

      
      const cookies = response.headers["set-cookie"];
      const refreshToken = getRefreshTokenFromCookie(cookies);
      expect(refreshToken).toBeDefined();
    });

    it("should not register a duplicate email, should return 409", async () => {
      await request(app).post("/auth/register").send(testUser);

      const response = await request(app).post("/auth/register").send(testUser);

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });


  describe("POST /auth/login", () => {
    beforeEach(async () => {
      await request(app).post("/auth/register").send(testUser);
    });

    it("should fail to log in with an incorrect password, should return 401", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email, password: "wrongpassword" });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it("should log in with correct credentials, return 200, and provide new tokens", async () => {
      const response = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.user.email).toBe(testUser.email);

      const cookies = response.headers["set-cookie"];
      const refreshToken = getRefreshTokenFromCookie(cookies);
      expect(refreshToken).toBeDefined();
    });
  });

  describe("Authenticated Endpoints", () => {
    let accessToken: string;
    let refreshToken: string;

    beforeEach(async () => {
      await request(app).post("/auth/register").send(testUser);
      const loginResponse = await request(app)
        .post("/auth/login")
        .send({ email: testUser.email, password: testUser.password });

      accessToken = loginResponse.body.data.accessToken;
      refreshToken = getRefreshTokenFromCookie(
        loginResponse.headers["set-cookie"]
      )!;
    });

    it("GET /auth/user: should return user data with a valid access token", async () => {
      const response = await request(app)
        .get("/auth/user")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
    });

    it("GET /auth/user: should return 401 without a token", async () => {
      const response = await request(app).get("/auth/user");
      expect(response.status).toBe(401);
    });

    it("POST /auth/refresh: should generate new tokens with a valid refresh cookie", async () => {
      await delay(1100);

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", `${REFRESH_COOKIE}=${refreshToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.accessToken).not.toBe(accessToken);

      const newRefreshToken = getRefreshTokenFromCookie(
        response.headers["set-cookie"]
      );
      expect(newRefreshToken).toBeDefined();
      expect(newRefreshToken).not.toBe(refreshToken);
    });

    it("POST /auth/logout: should log out successfully and clear the cookie", async () => {
      const response = await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const clearedCookie = response.headers["set-cookie"]?.[0];
      expect(clearedCookie).toContain("Expires=Thu, 01 Jan 1970");

      const dbUser = await UserModel.findOne({ email: testUser.email });
      expect(dbUser?.refreshTokenHash).toBeNull();
    });

  
    it("POST /auth/refresh: should return 401 when using a refresh token after logout", async () => {
      await request(app)
        .post("/auth/logout")
        .set("Authorization", `Bearer ${accessToken}`);

      const response = await request(app)
        .post("/auth/refresh")
        .set("Cookie", `${REFRESH_COOKIE}=${refreshToken}`);

      expect(response.status).toBe(401);
    });
  });
});
