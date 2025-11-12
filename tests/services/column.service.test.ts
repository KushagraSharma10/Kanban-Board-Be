import { Types } from "mongoose";
import * as ColumnService from "../../src/services/column.service.js";
import * as ColumnDAO from "../../src/dao/column.dao.js";
import { BoardModel } from "../../src/models/board.model.js";
import { ColumnModel } from "../../src/models/column.model.js"; 
import * as BoardAuth from "../../src/utils/boardAuth.js";
import { ApiError } from "../../src/utils/ApiError.js";

jest.mock("../../src/dao/column.dao");
jest.mock("../../src/models/board.model");
jest.mock("../../src/models/column.model"); 
jest.mock("../../src/utils/boardAuth");

describe("ColumnService", () => {
  const userId = new Types.ObjectId().toHexString();
  const boardId = new Types.ObjectId().toHexString();
  const mockBoard = { _id: boardId, name: "Test Board" };

  beforeEach(() => {
    jest.clearAllMocks();
  });


  describe("listColumnsForBoard", () => {
    it("should return existing columns if count > 0", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (ColumnDAO.countColumnsByBoardId as jest.Mock).mockResolvedValue(5);
      (ColumnDAO.findColumnsByBoardIdSorted as jest.Mock).mockResolvedValue([
        "col1",
      ]);

      const result = await ColumnService.listColumnsForBoard(userId, boardId);

      expect(ColumnDAO.insertDefaultColumns).not.toHaveBeenCalled();
      expect(result).toEqual(["col1"]);
    });

    it("should create defaults if count is 0", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (ColumnDAO.countColumnsByBoardId as jest.Mock).mockResolvedValue(0);
      (ColumnDAO.findColumnsByBoardIdSorted as jest.Mock).mockResolvedValue([
        "default",
      ]);

      await ColumnService.listColumnsForBoard(userId, boardId);

      expect(ColumnDAO.insertDefaultColumns).toHaveBeenCalledWith(
        boardId,
        userId,
        expect.any(Array)
      );
    });
  });


  describe("createColumnService", () => {
    it("should create a column at the end position", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);

      (ColumnDAO.findLastColumnInBoard as jest.Mock).mockResolvedValue({
        position: 5,
      });
      (ColumnDAO.createColumnDoc as jest.Mock).mockResolvedValue({
        name: "New",
      });

      await ColumnService.createColumnService(userId, boardId, "New Column");

      expect(ColumnDAO.createColumnDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          position: 6,
          name: "New Column",
        })
      );
    });

    it("should throw 403 if user is not admin", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(false);

      await expect(
        ColumnService.createColumnService(userId, boardId, "Name")
      ).rejects.toThrow(ApiError);
    });
  });

  describe("reorderColumnsService", () => {
    it("should execute bulkWrite directly without transaction", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);

      const colId1 = new Types.ObjectId().toHexString();
      const colId2 = new Types.ObjectId().toHexString();

      const updates = [
        { columnId: colId1, position: 0 },
        { columnId: colId2, position: 1 },
      ];

      (ColumnDAO.findColumnsByIdsForBoard as jest.Mock).mockResolvedValue([
        { _id: colId1 },
        { _id: colId2 },
      ]);

      (ColumnDAO.findColumnsByBoardIdSorted as jest.Mock).mockResolvedValue([
        "sorted",
      ]);

      const mockBulkWrite = jest.fn().mockResolvedValue({ ok: 1 });
      (ColumnModel.bulkWrite as jest.Mock) = mockBulkWrite;

      await ColumnService.reorderColumnsService(userId, boardId, updates);

      expect(mockBulkWrite).toHaveBeenCalledTimes(1);

      const expectedOps = [
        {
          updateOne: {
            filter: {
              _id: expect.any(Types.ObjectId),
              boardId: expect.any(Types.ObjectId),
            },
            update: { $set: { position: 0 } },
          },
        },
        {
          updateOne: {
            filter: {
              _id: expect.any(Types.ObjectId),
              boardId: expect.any(Types.ObjectId),
            },
            update: { $set: { position: 1 } },
          },
        },
      ];

      expect(mockBulkWrite).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            updateOne: expect.objectContaining({
              update: { $set: { position: 0 } },
            }),
          }),
          expect.objectContaining({
            updateOne: expect.objectContaining({
              update: { $set: { position: 1 } },
            }),
          }),
        ])
      );
    });

    it("should throw 400 if columns do not belong to the board", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);

      const updates = [
        { columnId: new Types.ObjectId().toHexString(), position: 0 },
      ];

      (ColumnDAO.findColumnsByIdsForBoard as jest.Mock).mockResolvedValue([]);

      await expect(
        ColumnService.reorderColumnsService(userId, boardId, updates)
      ).rejects.toThrow(ApiError);
    });
  });

  describe("updateColumnService", () => {
    it("should update column name if user is admin", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);
      (ColumnDAO.updateColumnName as jest.Mock).mockResolvedValue({
        name: "Updated",
      });

      const result = await ColumnService.updateColumnService(
        userId,
        boardId,
        "col-id",
        "Updated"
      );

      expect(ColumnDAO.updateColumnName).toHaveBeenCalledWith(
        boardId,
        "col-id",
        "Updated"
      );
      expect(result.name).toBe("Updated");
    });
  });

  describe("deleteColumnService", () => {
    it("should delete column and compact positions", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);
      (ColumnDAO.deleteColumnById as jest.Mock).mockResolvedValue({
        position: 2,
      });

      await ColumnService.deleteColumnService(userId, boardId, "col-id");

      expect(ColumnDAO.deleteColumnById).toHaveBeenCalledWith(
        boardId,
        "col-id"
      );
      expect(ColumnDAO.compactPositionsAfter).toHaveBeenCalledWith(boardId, 2);
    });
  });


  describe("getColumn", () => {
    it("should return column if found", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (ColumnDAO.findSingleColumnForBoard as jest.Mock).mockResolvedValue({
        name: "Col",
      });

      const result = await ColumnService.getColumn(userId, boardId, "col-id");

      expect(result).toEqual({ name: "Col" });
    });

    it("should throw 204 if not found", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue(mockBoard);
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (ColumnDAO.findSingleColumnForBoard as jest.Mock).mockResolvedValue(null);

      await expect(
        ColumnService.getColumn(userId, boardId, "col-id")
      ).rejects.toThrow(ApiError);
    });
  });
});
