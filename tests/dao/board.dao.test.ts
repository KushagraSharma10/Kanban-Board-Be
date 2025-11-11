import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js"; 
import { BoardModel } from "../../src/models/board.model.js";
import * as BoardDAO from "../../src/dao/board.dao.js";
import { Types } from "mongoose";

describe("BoardDAO (Integration)", () => {
  beforeAll(async () => {
    await connectTestDB();
  });

  beforeEach(async () => {
    await dropTestDB();
  });

  afterAll(async () => {
    await disconnectTestDB();
  });

  const userAId = new Types.ObjectId();
  const userBId = new Types.ObjectId();
  const boardData = {
    name: "DAO Test Board",
    type: "private",
    color: "#ffffff",
    createdBy: userAId,
  };

  describe("createBoardDoc", () => {
    it("should create and save a new board", async () => {
      const createdBoard = await BoardDAO.createBoardDoc(boardData);

      expect(createdBoard).toBeDefined();
      expect(createdBoard.name).toBe(boardData.name);
      expect(createdBoard.createdBy).toEqual(boardData.createdBy);

     const dbBoard = await BoardModel.findById(
        (createdBoard._id as Types.ObjectId).toHexString()
      );
      expect(dbBoard).toBeDefined();
      expect(dbBoard?.name).toBe(boardData.name);
    });
  });

  describe("findBoardsForUser", () => {
    it("should find boards created by the user", async () => {
      await BoardDAO.createBoardDoc(boardData); 
      const boards = await BoardDAO.findBoardsForUser(userAId.toHexString());
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe(boardData.name);
    });

    it("should find boards where the user is a member", async () => {
      await BoardDAO.createBoardDoc({
        ...boardData,
        name: "Board 2",
        createdBy: userBId, 
        members: [{ user: userAId, roles: ["user"], }], 
      });
      const boards = await BoardDAO.findBoardsForUser(userAId.toHexString());
      expect(boards).toHaveLength(1);
      expect(boards[0].name).toBe("Board 2");
    });

    it("should find both created and member boards", async () => {
      await BoardDAO.createBoardDoc(boardData); 
      await BoardDAO.createBoardDoc({
        ...boardData,
        name: "Board 2",
        createdBy: userBId,
        members: [{ user: userAId, roles: ["user"], }],
      });
      const boards = await BoardDAO.findBoardsForUser(userAId.toHexString());
      expect(boards).toHaveLength(2);
    });
  });

  describe("findBoardById", () => {
    it("should find a board by its ID", async () => {
      const createdBoard = await BoardDAO.createBoardDoc(boardData);
      const foundBoard = await BoardDAO.findBoardById(
       (createdBoard._id as Types.ObjectId).toHexString()
      );
      expect(foundBoard).toBeDefined();
      expect(foundBoard?.name).toBe(createdBoard.name);
    });
  });

  describe("saveBoard", () => {
    it("should save changes to an existing board document", async () => {
      const createdBoard = await BoardDAO.createBoardDoc(boardData);
      const newName = "Updated Board Name";

      createdBoard.name = newName;
      await BoardDAO.saveBoard(createdBoard);

      const foundBoard = await BoardDAO.findBoardById(
        (createdBoard._id as Types.ObjectId).toHexString()
      );
      expect(foundBoard?.name).toBe(newName);
    });
  });

  describe("deleteBoardById", () => {
    it("should delete a board by its ID", async () => {
      const createdBoard = await BoardDAO.createBoardDoc(boardData);
      const boardId = (createdBoard._id as Types.ObjectId).toHexString()

      await BoardDAO.deleteBoardById(boardId);

      const foundBoard = await BoardDAO.findBoardById(boardId);
      expect(foundBoard).toBeNull();
    });
  });
});