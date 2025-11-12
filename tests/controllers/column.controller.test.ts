import { Response, Request } from "express";
import {
  getColumnsForBoard,
  createColumn,
  reorderColumns,
} from "../../src/controllers/column.controller.js";
import * as ColumnService from "../../src/services/column.service.js";
import type { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js";

jest.mock("../../src/services/column.service.js");

const getMockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("ColumnController", () => {
  let mockResponse: Response;
  const mockNext = jest.fn();
  const userId = "user-123";
  const boardId = "board-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = getMockRes();
  });

  describe("getColumnsForBoard", () => {
    it("should return 200 and columns list", async () => {
      const mockReq = {
        userId,
        params: { boardId },
      } as unknown as AuthenticatedRequest;
      
      (ColumnService.listColumnsForBoard as jest.Mock).mockResolvedValue([{ name: "Col 1" }]);

      await getColumnsForBoard(mockReq, mockResponse, mockNext);

      expect(ColumnService.listColumnsForBoard).toHaveBeenCalledWith(userId, boardId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [{ name: "Col 1" }],
      });
    });
  });

  describe("createColumn", () => {
    it("should return 201 and created column", async () => {
      const mockReq = {
        userId,
        params: { boardId },
        body: { name: "New Col" },
      } as unknown as AuthenticatedRequest;
      
      (ColumnService.createColumnService as jest.Mock).mockResolvedValue({ name: "New Col" });

      await createColumn(mockReq, mockResponse, mockNext);

      expect(ColumnService.createColumnService).toHaveBeenCalledWith(userId, boardId, "New Col");
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("reorderColumns", () => {
    it("should return 200 and updated list", async () => {
      const updates = [{ columnId: "c1", position: 0 }];
      const mockReq = {
        userId,
        params: { boardId },
        body: { updates },
      } as unknown as AuthenticatedRequest;
      
      (ColumnService.reorderColumnsService as jest.Mock).mockResolvedValue([]);

      await reorderColumns(mockReq, mockResponse, mockNext);

      expect(ColumnService.reorderColumnsService).toHaveBeenCalledWith(userId, boardId, updates);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});