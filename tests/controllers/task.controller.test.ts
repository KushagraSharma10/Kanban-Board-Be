import { Response } from "express";
import {
  createTaskInColumn,
  getTasksForColumn,
  updateTaskDetails,
  deleteTaskFromColumn,
  getTaskById, 
} from "../../src/controllers/task.controller.js";
import * as TaskService from "../../src/services/task.service.js";
import type { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js";

jest.mock("../../src/services/task.service");

const getMockRes = () => {
  const res: Partial<Response> = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as Response;
};

describe("TaskController", () => {
  let mockResponse: Response;
  const mockNext = jest.fn();
  const userId = "user-123";

  beforeEach(() => {
    jest.clearAllMocks();
    mockResponse = getMockRes();
  });

  describe("createTaskInColumn", () => {
    it("should call service and return 201", async () => {
      const mockReq = {
        userId,
        params: { boardId: "b1", columnId: "c1" },
        body: { title: "Task 1" },
      } as unknown as AuthenticatedRequest;

      (TaskService.createTask as jest.Mock).mockResolvedValue({ title: "Task 1" });

      await createTaskInColumn(mockReq, mockResponse, mockNext);

      expect(TaskService.createTask).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(201);
    });
  });

  describe("getTasksForColumn", () => {
    it("should return 200 with list", async () => {
      const mockReq = {
        userId,
        params: { boardId: "b1", columnId: "c1" },
      } as unknown as AuthenticatedRequest;
      
      (TaskService.getTasks as jest.Mock).mockResolvedValue([]);

      await getTasksForColumn(mockReq, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
  
  describe("updateTaskDetails", () => {
     it("should return 200 with updated task", async () => {
        const mockReq = {
           userId,
           params: { boardId: "b1", columnId: "c1", taskId: "t1" },
           body: { title: "New Title" }
        } as unknown as AuthenticatedRequest;
        
        (TaskService.updateTask as jest.Mock).mockResolvedValue({ title: "New Title" });
        
        await updateTaskDetails(mockReq, mockResponse, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(200);
     });
  });
  
  describe("deleteTaskFromColumn", () => {
     it("should return 200", async () => {
        const mockReq = {
           userId,
           params: { boardId: "b1", columnId: "c1", taskId: "t1" }
        } as unknown as AuthenticatedRequest;
        
        (TaskService.deleteTask as jest.Mock).mockResolvedValue(true);
        
        await deleteTaskFromColumn(mockReq, mockResponse, mockNext);
        
        expect(mockResponse.status).toHaveBeenCalledWith(200);
     });
  });

  describe("getTaskById", () => {
    it("should return 200 with single task data", async () => {
       const mockReq = {
          userId,
          params: { boardId: "b1", columnId: "c1", taskId: "t1" }
       } as unknown as AuthenticatedRequest;
       
       const mockTask = { _id: "t1", title: "Single Task" };
       (TaskService.getTask as jest.Mock).mockResolvedValue(mockTask);
       
       await getTaskById(mockReq, mockResponse, mockNext);
       
       expect(TaskService.getTask).toHaveBeenCalled();
       expect(mockResponse.status).toHaveBeenCalledWith(200);
       expect(mockResponse.json).toHaveBeenCalledWith(
         expect.objectContaining({ 
           success: true, 
           data: mockTask 
         })
       );
    });
 });
});