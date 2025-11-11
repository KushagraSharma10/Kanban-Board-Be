import request from "supertest";
import app from "../../src/app.js"; 
import {
  createBoardService,
  listBoardsForUser,
  getBoard,
  updateBoardService,
  deleteBoardService,
} from "../../src/services/board.service.js"; 
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js"; 
import Joi from "joi";

jest.mock("../../src/services/board.service");

jest.mock("../../src/middlewares/requireAuth", () => ({
  requireAuth: (
    req: AuthenticatedRequest,
    _res: Response,
    next: NextFunction
  ) => {
    req.userId = "mock-user-id-from-middleware"; 
    next();
  },
}));

jest.mock("../../src/middlewares/validate.middleware", () => ({
  validate: (_schema: Joi.Schema) => (
    _req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    next();
  },
}));

const mockedCreateBoard = createBoardService as jest.Mock;
const mockedListBoards = listBoardsForUser as jest.Mock;
const mockedGetBoard = getBoard as jest.Mock;
const mockedUpdateBoard = updateBoardService as jest.Mock;
const mockedDeleteBoard = deleteBoardService as jest.Mock;

const mockBoard = { id: "board-123", name: "Test Board" };
const mockUserId = "mock-user-id-from-middleware";

describe("Board Routes (Integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /boards", () => {
    it("should call listBoardsForUser", async () => {
      mockedListBoards.mockResolvedValue([mockBoard]);
      const response = await request(app)
        .get("/boards")
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedListBoards).toHaveBeenCalledWith(mockUserId);
      expect(response.body.data).toEqual([mockBoard]);
    });
  });

  describe("POST /boards", () => {
    it("should call createBoardService", async () => {
      const boardInput = { name: "New", type: "public", color: "#000" };
      mockedCreateBoard.mockResolvedValue(mockBoard);

      const response = await request(app)
        .post("/boards")
        .send(boardInput)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(201);
      expect(mockedCreateBoard).toHaveBeenCalledWith(mockUserId, boardInput);
    });
  });

  describe("GET /boards/:id", () => {
    it("should call getBoard", async () => {
      const boardId = "board-123";
      mockedGetBoard.mockResolvedValue(mockBoard);

      const response = await request(app)
        .get(`/boards/${boardId}`)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedGetBoard).toHaveBeenCalledWith(mockUserId, boardId);
    });
  });

  describe("PATCH /boards/:id", () => {
    it("should call updateBoardService", async () => {
      const boardId = "board-123";
      const updates = { name: "Updated" };
      mockedUpdateBoard.mockResolvedValue({ ...mockBoard, ...updates });

      const response = await request(app)
        .patch(`/boards/${boardId}`)
        .send(updates)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedUpdateBoard).toHaveBeenCalledWith(
        mockUserId,
        boardId,
        updates
      );
    });
  });

  describe("DELETE /boards/:id", () => {
    it("should call deleteBoardService", async () => {
      const boardId = "board-123";
      mockedDeleteBoard.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/boards/${boardId}`)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedDeleteBoard).toHaveBeenCalledWith(mockUserId, boardId);
    });
  });
});