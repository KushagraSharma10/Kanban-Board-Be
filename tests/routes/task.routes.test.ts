import request from "supertest";
import app from "../../src/app.js";
import * as TaskService from "../../src/services/task.service.js";
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../../src/middlewares/requireAuth.js";
import Joi from "joi";

jest.mock("../../src/services/task.service");
jest.mock("../../src/middlewares/requireAuth", () => ({
  requireAuth: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => {
    req.userId = "mock-user";
    next();
  },
}));
jest.mock("../../src/middlewares/validate.middleware", () => ({
  validate: (_schema: Joi.Schema) => (_req: Request, _res: Response, next: NextFunction) => {
    next();
  },
}));

describe("Task Routes (Integration)", () => {
  const boardId = "b1";
  const columnId = "c1";
  const taskId = "t1";

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("POST /:boardId/columns/:columnId/tasks", () => {
    it("should call createTask service", async () => {
      (TaskService.createTask as jest.Mock).mockResolvedValue({});
      
      const res = await request(app)
        .post(`/${boardId}/columns/${columnId}/tasks`)
        .send({ title: "Task" });

      expect(res.status).toBe(201);
      expect(TaskService.createTask).toHaveBeenCalled();
    });
  });

  describe("GET /:boardId/columns/:columnId/tasks", () => {
    it("should call getTasks service", async () => {
      (TaskService.getTasks as jest.Mock).mockResolvedValue([]);
      
      const res = await request(app)
        .get(`/${boardId}/columns/${columnId}/tasks`);

      expect(res.status).toBe(200);
      expect(TaskService.getTasks).toHaveBeenCalled();
    });
  });

  describe("PATCH /:boardId/columns/:columnId/tasks/:taskId", () => {
    it("should call updateTask service", async () => {
      (TaskService.updateTask as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .patch(`/${boardId}/columns/${columnId}/tasks/${taskId}`)
        .send({ title: "Updated" });

      expect(res.status).toBe(200);
      expect(TaskService.updateTask).toHaveBeenCalled();
    });
  });

  describe("DELETE /:boardId/columns/:columnId/tasks/:taskId", () => {
    it("should call deleteTask service", async () => {
      (TaskService.deleteTask as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .delete(`/${boardId}/columns/${columnId}/tasks/${taskId}`);

      expect(res.status).toBe(200);
      expect(TaskService.deleteTask).toHaveBeenCalled();
    });
  });

  describe("GET /:boardId/columns/:columnId/tasks/:taskId", () => {
    it("should call getTask (single) service", async () => {
      (TaskService.getTask as jest.Mock).mockResolvedValue({});

      const res = await request(app)
        .get(`/${boardId}/columns/${columnId}/tasks/${taskId}`);

      expect(res.status).toBe(200);
      expect(TaskService.getTask).toHaveBeenCalled();
    });
  });
});