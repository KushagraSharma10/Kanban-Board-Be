import { Request, Response } from "express";
import {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} from "../../src/controllers/board.controller.js"; 
import {
  createBoardService,
  listBoardsForUser,
  getBoard,
  updateBoardService,
  deleteBoardService,
} from "../../src/services/board.service.js"; 
import type { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js"; 

jest.mock("../../src/services/board.service");

const mockedCreateBoard = createBoardService as jest.Mock;
const mockedListBoards = listBoardsForUser as jest.Mock;
const mockedGetBoard = getBoard as jest.Mock;
const mockedUpdateBoard = updateBoardService as jest.Mock;
const mockedDeleteBoard = deleteBoardService as jest.Mock;

const getMockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

const mockBoard = { id: "board-123", name: "Test Board" };
const mockUserId = "user-123";

describe("BoardController", () => {
  let mockResponse: Response;
  const mockNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = getMockRes();
  });

  describe("createBoard", () => {
    it("should call createBoardService and return 201", async () => {
      const mockRequest = {
        userId: mockUserId,
        body: { name: "New Board", type: "private", color: "#fff" },
      } as AuthenticatedRequest;

      mockedCreateBoard.mockResolvedValue(mockBoard);

      await createBoard(mockRequest, mockResponse, mockNext);

      expect(mockedCreateBoard).toHaveBeenCalledWith(
        mockUserId,
        mockRequest.body
      );
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Board created",
        data: mockBoard,
      });
    });
  });

  describe("getMyBoards", () => {
    it("should call listBoardsForUser and return 200", async () => {
      const mockRequest = { userId: mockUserId } as AuthenticatedRequest;
      mockedListBoards.mockResolvedValue([mockBoard]);

      await getMyBoards(mockRequest, mockResponse, mockNext);

      expect(mockedListBoards).toHaveBeenCalledWith(mockUserId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: [mockBoard],
      });
    });
  });

  describe("getBoardById", () => {
    it("should call getBoard and return 200", async () => {
      const mockBoardId = "board-123";
      const mockRequest = {
        userId: mockUserId,
        params: { id: mockBoardId },
      } as unknown as AuthenticatedRequest;

      mockedGetBoard.mockResolvedValue(mockBoard);

      await getBoardById(mockRequest, mockResponse, mockNext);

      expect(mockedGetBoard).toHaveBeenCalledWith(mockUserId, mockBoardId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        data: mockBoard,
      });
    });
  });

  describe("updateBoard", () => {
    it("should call updateBoardService and return 200", async () => {
      const mockBoardId = "board-123";
      const updates = { name: "Updated Name" };
      const mockRequest = {
        userId: mockUserId,
        params: { id: mockBoardId },
        body: updates,
      } as unknown as AuthenticatedRequest;

      mockedUpdateBoard.mockResolvedValue({ ...mockBoard, ...updates });

      await updateBoard(mockRequest, mockResponse, mockNext);

      expect(mockedUpdateBoard).toHaveBeenCalledWith(
        mockUserId,
        mockBoardId,
        updates
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({ data: { ...mockBoard, ...updates } })
      );
    });
  });

  describe("deleteBoard", () => {
    it("should call deleteBoardService and return 200", async () => {
      const mockBoardId = "board-123";
      const mockRequest = {
        userId: mockUserId,
        params: { id: mockBoardId },
      } as unknown as AuthenticatedRequest;

      mockedDeleteBoard.mockResolvedValue(true);

      await deleteBoard(mockRequest, mockResponse, mockNext);

      expect(mockedDeleteBoard).toHaveBeenCalledWith(mockUserId, mockBoardId);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Board deleted",
      });
    });
  });
});