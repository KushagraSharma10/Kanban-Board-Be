import { Types } from "mongoose";
import {
  createBoardService,
  listBoardsForUser,
  getBoard,
  updateBoardService,
  deleteBoardService,
} from "../../src/services/board.service.js"; 
import * as BoardDAO from "../../src/dao/board.dao.js";
import * as UserDAO from "../../src/dao/user.dao.js";
import * as BoardAuth from "../../src/utils/boardAuth.js";
import { ApiError } from "../../src/utils/ApiError.js";
import { BoardDocument } from "../../src/interfaces/boards.js";

jest.mock("../../src/dao/board.dao");
jest.mock("../../src/dao/user.dao");
jest.mock("../../src/utils/boardAuth");

const mockedCreateBoardDoc = BoardDAO.createBoardDoc as jest.Mock;
const mockedFindBoardsForUser = BoardDAO.findBoardsForUser as jest.Mock;
const mockedFindBoardById = BoardDAO.findBoardById as jest.Mock;
const mockedSaveBoard = BoardDAO.saveBoard as jest.Mock;
const mockedDeleteBoardById = BoardDAO.deleteBoardById as jest.Mock;
const mockedAddBoardToUser = UserDAO.addBoardToUser as jest.Mock;
const mockedPullBoardFromAllUsers = UserDAO.pullBoardFromAllUsers as jest.Mock;
const mockedIsMember = BoardAuth.isMember as jest.Mock;
const mockedIsAdmin = BoardAuth.isAdmin as jest.Mock;

const mockUserId = new Types.ObjectId().toHexString();
const mockBoardId = new Types.ObjectId().toHexString();

const getMockBoard = (isAdmin: boolean, isMember: boolean) => {
  const board = {
    _id: mockBoardId,
    name: "Mock Board",
    type: "private",
    color: "#fff",
    createdBy: isAdmin ? new Types.ObjectId(mockUserId) : new Types.ObjectId(),
    members: isMember
      ? [{ user: new Types.ObjectId(mockUserId), roles: ["member"] }]
      : [],
    save: jest.fn().mockResolvedValue(this),
  };
  
  board.save = jest.fn().mockResolvedValue(board);
  return board as unknown as BoardDocument;
};

describe("BoardService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createBoardService", () => {
    it("should create a board and add it to the user", async () => {
      const input = { name: "Test Board", type: "private", color: "#123" };
      const mockBoard = getMockBoard(true, true);
      mockedCreateBoardDoc.mockResolvedValue(mockBoard);
      mockedAddBoardToUser.mockResolvedValue(true);

      const result = await createBoardService(mockUserId, input);

      expect(mockedCreateBoardDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          name: input.name,
          createdBy: expect.any(Types.ObjectId),
        })
      );
      expect(mockedAddBoardToUser).toHaveBeenCalledWith(
        mockUserId,
        mockBoard._id
      );
      expect(result.name).toBe(mockBoard.name);
    });

    it("should throw 400 if name is missing", async () => {
      const input = { name: "", type: "private", color: "#123" };
      await expect(createBoardService(mockUserId, input)).rejects.toThrow(
        ApiError
      );
      await expect(createBoardService(mockUserId, input)).rejects.toMatchObject(
        { statusCode: 400 }
      );
    });
  });

  describe("listBoardsForUser", () => {
    it("should call findBoardsForUser", async () => {
      mockedFindBoardsForUser.mockResolvedValue([]);
      await listBoardsForUser(mockUserId);
      expect(mockedFindBoardsForUser).toHaveBeenCalledWith(mockUserId);
    });
  });

  describe("getBoard", () => {
    it("should throw 204 if board not found", async () => {
      mockedFindBoardById.mockResolvedValue(null);
      await expect(getBoard(mockUserId, mockBoardId)).rejects.toThrow(ApiError);
      await expect(getBoard(mockUserId, mockBoardId)).rejects.toMatchObject({
        statusCode: 204,
      });
    });

    it("should throw 403 if user is not a member", async () => {
      const mockBoard = getMockBoard(false, false);
      mockedFindBoardById.mockResolvedValue(mockBoard);
      mockedIsMember.mockReturnValue(false);

      await expect(getBoard(mockUserId, mockBoardId)).rejects.toThrow(ApiError);
      await expect(getBoard(mockUserId, mockBoardId)).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("should return the board if user is a member", async () => {
      const mockBoard = getMockBoard(false, true);
      mockedFindBoardById.mockResolvedValue(mockBoard);
      mockedIsMember.mockReturnValue(true); 
      const board = await getBoard(mockUserId, mockBoardId);
      expect(board.name).toBe(mockBoard.name);
    });
  });

  describe("updateBoardService", () => {
    it("should throw 403 if user is not an admin", async () => {
      const mockBoard = getMockBoard(false, true);
      mockedFindBoardById.mockResolvedValue(mockBoard);
      mockedIsAdmin.mockReturnValue(false);

      await expect(
        updateBoardService(mockUserId, mockBoardId, { name: "New Name" })
      ).rejects.toThrow(ApiError);
      await expect(
        updateBoardService(mockUserId, mockBoardId, { name: "New Name" })
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("should update the board if user is an admin", async () => {
      const mockBoard = getMockBoard(true, true);
      const newName = "Updated Name";
      mockedFindBoardById.mockResolvedValue(mockBoard);
      mockedIsAdmin.mockReturnValue(true);
      mockedSaveBoard.mockResolvedValue({ ...mockBoard, name: newName });

      const updatedBoard = await updateBoardService(mockUserId, mockBoardId, {
        name: newName,
      });

      expect(mockBoard.name).toBe(newName); 
      expect(mockedSaveBoard).toHaveBeenCalledWith(mockBoard);
      expect(updatedBoard.name).toBe(newName);
    });
  });

  describe("deleteBoardService", () => {
    it("should throw 403 if user is not an admin", async () => {
      const mockBoard = getMockBoard(false, true);
      mockedFindBoardById.mockResolvedValue(mockBoard);
      mockedIsAdmin.mockReturnValue(false);

      await expect(
        deleteBoardService(mockUserId, mockBoardId)
      ).rejects.toThrow(ApiError);
      await expect(
        deleteBoardService(mockUserId, mockBoardId)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("should delete the board if user is an admin", async () => {
      const mockBoard = getMockBoard(true, true);
      mockedFindBoardById.mockResolvedValue(mockBoard);
      mockedIsAdmin.mockReturnValue(true); 
      mockedDeleteBoardById.mockResolvedValue(true);
      mockedPullBoardFromAllUsers.mockResolvedValue(true);

      const result = await deleteBoardService(mockUserId, mockBoardId);

      expect(mockedDeleteBoardById).toHaveBeenCalledWith(mockBoardId);
      expect(mockedPullBoardFromAllUsers).toHaveBeenCalledWith(mockBoardId);
      expect(result).toBe(true);
    });
  });
});