import { Types } from "mongoose";
import * as TaskService from "../../src/services/task.service.js";
import * as TaskDAO from "../../src/dao/task.dao.js";
import { BoardModel } from "../../src/models/board.model.js";
import { ColumnModel } from "../../src/models/column.model.js";
import * as BoardAuth from "../../src/utils/boardAuth.js";
import { ApiError } from "../../src/utils/ApiError.js";

jest.mock("../../src/dao/task.dao");
jest.mock("../../src/models/board.model");
jest.mock("../../src/models/column.model");
jest.mock("../../src/utils/boardAuth");
jest.mock("../../src/utils/assignee.helper", () => ({
  ensureAssigneeMembershipAndResolveIds: jest.fn().mockResolvedValue({
    assigneeUserId: new Types.ObjectId(),
    normalizedAssigneeEmail: "test@user.com"
  })
}));

describe("TaskService", () => {
  const userId = new Types.ObjectId().toHexString();
  const boardId = new Types.ObjectId().toHexString();
  const columnId = new Types.ObjectId().toHexString();
  const taskId = new Types.ObjectId().toHexString();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createTask", () => {
    it("should create a task if user is admin", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue({});
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);
      (ColumnModel.exists as jest.Mock).mockResolvedValue(true);
      (TaskDAO.findLastTaskInColumn as jest.Mock).mockResolvedValue({ position: 0 });
      (TaskDAO.createTaskDoc as jest.Mock).mockResolvedValue({ title: "New Task" });

      const result = await TaskService.createTask(
        userId,
        { boardId, columnId },
        { title: "New Task" }
      );

      expect(TaskDAO.createTaskDoc).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "New Task",
          position: 1, 
        })
      );
      expect(result.title).toBe("New Task");
    });

    it("should throw 403 if user is not admin", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue({});
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(false); 

      await expect(
        TaskService.createTask(userId, { boardId, columnId }, { title: "Task" })
      ).rejects.toThrow(ApiError);
    });
  });

  describe("getTasks", () => {
    it("should return sorted tasks", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue({});
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (ColumnModel.exists as jest.Mock).mockResolvedValue(true);
      (TaskDAO.findTasksByColumnSorted as jest.Mock).mockResolvedValue(["task1"]);

      const result = await TaskService.getTasks(userId, { boardId, columnId });

      expect(result).toEqual(["task1"]);
    });
  });

  describe("getTask", () => {
    it("should return a single task if found", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue({});
      (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
      (ColumnModel.exists as jest.Mock).mockResolvedValue(true);
      (TaskDAO.findTaskInBoardColumn as jest.Mock).mockResolvedValue({ _id: taskId, title: "Single Task" });

      const result = await TaskService.getTask(userId, { boardId, columnId, taskId });

      expect(result).toBeDefined();
      expect(result.title).toBe("Single Task");
    });

    it("should throw 204 if task not found", async () => {
        (BoardModel.findById as jest.Mock).mockResolvedValue({});
        (BoardAuth.isMember as jest.Mock).mockReturnValue(true);
        (ColumnModel.exists as jest.Mock).mockResolvedValue(true);
        (TaskDAO.findTaskInBoardColumn as jest.Mock).mockResolvedValue(null);
  
        await expect(
          TaskService.getTask(userId, { boardId, columnId, taskId })
        ).rejects.toThrow(ApiError);
      });
  });

  describe("updateTask", () => {
    it("should update task if found and user is admin", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue({});
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);
      (ColumnModel.exists as jest.Mock).mockResolvedValue(true);
      (TaskDAO.findTaskInBoardColumn as jest.Mock).mockResolvedValue({ _id: taskId });
      (TaskDAO.updateTaskById as jest.Mock).mockResolvedValue({ title: "Updated" });

      const result = await TaskService.updateTask(
        userId,
        { boardId, columnId, taskId },
        { title: "Updated" }
      );

      expect(result?.title).toBe("Updated");
    });
  });

  describe("deleteTask", () => {
    it("should delete task and compact positions", async () => {
      (BoardModel.findById as jest.Mock).mockResolvedValue({});
      (BoardAuth.isAdmin as jest.Mock).mockReturnValue(true);
      (ColumnModel.exists as jest.Mock).mockResolvedValue(true);
      (TaskDAO.deleteTaskInBoardColumn as jest.Mock).mockResolvedValue({ position: 2 });

      await TaskService.deleteTask(userId, { boardId, columnId, taskId });

      expect(TaskDAO.deleteTaskInBoardColumn).toHaveBeenCalled();
      expect(TaskDAO.compactTaskPositionsAfter).toHaveBeenCalledWith(
        boardId,
        columnId,
        2
      );
    });
  });
});