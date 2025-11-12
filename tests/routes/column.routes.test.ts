import request from "supertest";
import app from "../../src/app.js"; 
import {
  createColumnService,
  listColumnsForBoard,
  getColumn,
  updateColumnService,
  deleteColumnService,
  reorderColumnsService,
} from "../../src/services/column.service.js"; 
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js"; 
import Joi from "joi"; 

jest.mock("../../src/services/column.service");
jest.mock("../../src/middlewares/requireAuth", () => ({
  requireAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.userId = "mock-user-id-from-middleware"; 
    next();
  },
}));
jest.mock("../../src/middlewares/validate.middleware", () => ({
  validate: (_schema: Joi.Schema) => (_req: Request, _res: Response, next: NextFunction) => {
    next(); 
  },
}));

const mockedCreateColumn = createColumnService as jest.Mock;
const mockedListColumns = listColumnsForBoard as jest.Mock;
const mockedGetColumn = getColumn as jest.Mock;
const mockedUpdateColumn = updateColumnService as jest.Mock;
const mockedDeleteColumn = deleteColumnService as jest.Mock;
const mockedReorderColumns = reorderColumnsService as jest.Mock;

const mockColumn = { _id: "col-123", name: "Test Column" };
const mockUserId = "mock-user-id-from-middleware";
const mockBoardId = "board-abc";
const mockColumnId = "col-123";

describe("Column Routes (Integration)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("GET /:boardId/columns", () => {
    it("should call listColumnsForBoard", async () => {
      mockedListColumns.mockResolvedValue([mockColumn]);
      const response = await request(app)
        .get(`/${mockBoardId}/columns`) 
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedListColumns).toHaveBeenCalledWith(mockUserId, mockBoardId);
      expect(response.body.data).toEqual([mockColumn]);
    });
  });

  describe("POST /:boardId/columns", () => {
    it("should call createColumnService", async () => {
      const colInput = { name: "New Column" };
      mockedCreateColumn.mockResolvedValue(mockColumn);

      const response = await request(app)
        .post(`/${mockBoardId}/columns`) 
        .send(colInput)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(201);
      expect(mockedCreateColumn).toHaveBeenCalledWith(mockUserId, mockBoardId, colInput.name);
    });
  });

  describe("GET /:boardId/columns/:columnId", () => {
    it("should call getColumn", async () => {
      mockedGetColumn.mockResolvedValue(mockColumn);

      const response = await request(app)
        .get(`/${mockBoardId}/columns/${mockColumnId}`) 
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedGetColumn).toHaveBeenCalledWith(mockUserId, mockBoardId, mockColumnId);
    });
  });

  describe("PATCH /:boardId/columns/:columnId", () => {
    it("should call updateColumnService", async () => {
      const updates = { name: "Updated Name" };
      mockedUpdateColumn.mockResolvedValue({ ...mockColumn, ...updates });

      const response = await request(app)
        .patch(`/${mockBoardId}/columns/${mockColumnId}`) 
        .send(updates)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedUpdateColumn).toHaveBeenCalledWith(mockUserId, mockBoardId, mockColumnId, updates.name);
    });
  });

  describe("DELETE /:boardId/columns/:columnId", () => {
    it("should call deleteColumnService", async () => {
      mockedDeleteColumn.mockResolvedValue(true);

      const response = await request(app)
        .delete(`/${mockBoardId}/columns/${mockColumnId}`) 
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedDeleteColumn).toHaveBeenCalledWith(mockUserId, mockBoardId, mockColumnId);
    });
  });

  describe("PATCH /:boardId/columns/reorder", () => {
    it("should call reorderColumnsService", async () => {
      const reorderBody = { updates: [{ columnId: "col-123", position: 0 }] };
      mockedReorderColumns.mockResolvedValue([mockColumn]);

      const response = await request(app)
        .patch(`/${mockBoardId}/columns/reorder`) 
        .send(reorderBody)
        .set("Authorization", "Bearer fake-token");

      expect(response.status).toBe(200);
      expect(mockedReorderColumns).toHaveBeenCalledWith(mockUserId, mockBoardId, reorderBody.updates);
    });
  });
});