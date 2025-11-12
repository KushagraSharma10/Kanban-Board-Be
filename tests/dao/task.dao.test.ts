import {
  connectTestDB,
  dropTestDB,
  disconnectTestDB,
} from "../testDb.js";
import { TaskModel } from "../../src/models/task.model.js";
import * as TaskDAO from "../../src/dao/task.dao.js";
import { Types } from "mongoose";

describe("TaskDAO (Integration)", () => {
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
  const columnId = new Types.ObjectId();
  const userId = new Types.ObjectId();

  const taskData = {
    boardId,
    columnId,
    title: "Test Task",
    position: 0,
    createdBy: userId,
    priority: "moderate" as const,
  };

  describe("createTaskDoc", () => {
    it("should create and save a new task", async () => {
      const task = await TaskDAO.createTaskDoc(taskData);
      
      expect(task).toBeDefined();
      expect(task.title).toBe(taskData.title);
      
      const dbTask = await TaskModel.findById(
        (task._id as Types.ObjectId).toHexString()
      );
      expect(dbTask).toBeDefined();
      expect(dbTask?.title).toBe(taskData.title);
    });
  });

  describe("findTasksByColumnSorted", () => {
    it("should return tasks sorted by position", async () => {
      await TaskDAO.createTaskDoc({ ...taskData, title: "Task 2", position: 2 });
      await TaskDAO.createTaskDoc({ ...taskData, title: "Task 1", position: 1 });
      
      const tasks = await TaskDAO.findTasksByColumnSorted(
        boardId.toHexString(),
        columnId.toHexString()
      );
      
      expect(tasks).toHaveLength(2);
      expect(tasks[0].title).toBe("Task 1");
      expect(tasks[1].title).toBe("Task 2");
    });
  });

  describe("findLastTaskInColumn", () => {
    it("should return the task with highest position", async () => {
      await TaskDAO.createTaskDoc({ ...taskData, position: 5 });
      await TaskDAO.createTaskDoc({ ...taskData, position: 10 });
      
      const last = await TaskDAO.findLastTaskInColumn(
        boardId.toHexString(),
        columnId.toHexString()
      );
      
      expect(last?.position).toBe(10);
    });
  });

  describe("findTaskInBoardColumn", () => {
    it("should find a specific task using IDs", async () => {
      const task = await TaskDAO.createTaskDoc(taskData);
      const taskId = (task._id as Types.ObjectId).toHexString();

      const found = await TaskDAO.findTaskInBoardColumn(
        boardId.toHexString(),
        columnId.toHexString(),
        taskId
      );

      expect(found).toBeDefined();
      expect(found?.title).toBe(taskData.title);
    });

    it("should return null if IDs do not match", async () => {
      const task = await TaskDAO.createTaskDoc(taskData);
      const taskId = (task._id as Types.ObjectId).toHexString();
      const wrongColumnId = new Types.ObjectId().toHexString();

      const found = await TaskDAO.findTaskInBoardColumn(
        boardId.toHexString(),
        wrongColumnId,
        taskId
      );

      expect(found).toBeNull();
    });
  });

  describe("updateTaskById", () => {
    it("should update task fields", async () => {
      const task = await TaskDAO.createTaskDoc(taskData);
      const updated = await TaskDAO.updateTaskById(
        (task._id as Types.ObjectId).toHexString(),
        { title: "Updated Title" }
      );
      
      expect(updated?.title).toBe("Updated Title");
    });
  });

  describe("deleteTaskInBoardColumn", () => {
    it("should delete the task", async () => {
      const task = await TaskDAO.createTaskDoc(taskData);
      
      await TaskDAO.deleteTaskInBoardColumn(
        boardId.toHexString(),
        columnId.toHexString(),
        (task._id as Types.ObjectId).toHexString()
      );
      
      const found = await TaskModel.findById(
        (task._id as Types.ObjectId).toHexString()
      );
      expect(found).toBeNull();
    });
  });

  describe("compactTaskPositionsAfter", () => {
    it("should decrease position of subsequent tasks", async () => {
        await TaskDAO.createTaskDoc({ ...taskData, title: "A", position: 0 });
        await TaskDAO.createTaskDoc({ ...taskData, title: "B", position: 1 });
        await TaskDAO.createTaskDoc({ ...taskData, title: "C", position: 2 });

        await TaskDAO.compactTaskPositionsAfter(
            boardId.toHexString(), 
            columnId.toHexString(), 
            0 
        );

        const tasks = await TaskModel.find({ boardId }).sort({ position: 1 });
        
        
        const taskB = tasks.find(t => t.position === 0 && t.title !== "Test Task"); 
        
        const positions = tasks.map(t => t.position).sort();
        expect(positions).toEqual([0, 0, 1]);
    });
  });
});