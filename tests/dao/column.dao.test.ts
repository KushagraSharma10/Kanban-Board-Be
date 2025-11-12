
import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js"; 
import { ColumnModel } from "../../src/models/column.model.js";
import * as ColumnDAO from "../../src/dao/column.dao.js";
import { Types } from "mongoose";

describe("ColumnDAO (Integration)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  const boardId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  describe("insertDefaultColumns", () => {
    it("should insert default columns with correct positions", async () => {
      const defaults = ["To Do", "Done"];
      await ColumnDAO.insertDefaultColumns(
        boardId.toHexString(),
        userId.toHexString(),
        defaults
      );

      const columns = await ColumnModel.find({ boardId }).sort({ position: 1 });
      expect(columns).toHaveLength(2);
      expect(columns[0].name).toBe("To Do");
      expect(columns[0].position).toBe(0);
      expect(columns[1].name).toBe("Done");
      expect(columns[1].position).toBe(1);
    });
  });

  describe("findLastColumnInBoard", () => {
    it("should return the column with the highest position", async () => {
      await ColumnDAO.createColumnDoc({
        boardId: boardId.toHexString(),
        name: "First",
        position: 0,
        createdBy: userId.toHexString(),
      });
      await ColumnDAO.createColumnDoc({
        boardId: boardId.toHexString(),
        name: "Second",
        position: 10,
        createdBy: userId.toHexString(),
      });

      const last = await ColumnDAO.findLastColumnInBoard(boardId.toHexString());
      expect(last).toBeDefined();
      expect(last?.name).toBe("Second");
      expect(last?.position).toBe(10);
    });
  });

  describe("updateColumnName", () => {
    it("should update the name of a column", async () => {
      const col = await ColumnDAO.createColumnDoc({
        boardId: boardId.toHexString(),
        name: "Old Name",
        position: 0,
        createdBy: userId.toHexString(),
      });

      const updated = await ColumnDAO.updateColumnName(
        boardId.toHexString(),
        (col._id as Types.ObjectId).toHexString(),
        "New Name"
      );

      expect(updated?.name).toBe("New Name");
    });
  });

  describe("compactPositionsAfter", () => {
    it("should decrease position of subsequent columns", async () => {
      await ColumnDAO.insertDefaultColumns(
        boardId.toHexString(),
        userId.toHexString(),
        ["A", "B", "C"]
      );
      
      await ColumnDAO.compactPositionsAfter(boardId.toHexString(), 0);

      const columns = await ColumnModel.find({ boardId }).sort({ position: 1 });
      
      const colB = columns.find((c) => c.name === "B");
      const colC = columns.find((c) => c.name === "C");

      expect(colB?.position).toBe(0);
      expect(colC?.position).toBe(1); 
    });
  });
});