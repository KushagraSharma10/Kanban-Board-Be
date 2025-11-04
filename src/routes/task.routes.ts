import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createTaskInColumn,
  deleteTaskFromColumn,
  getTaskById,
  getTasksForColumn,
  updateTaskDetails,
} from "../controllers/task.controller.js";
import {
  createTaskBodySchema,
  updateTaskBodySchema,
} from "../validators/task.schema.js";

const router = Router({ mergeParams: true });

router.use(requireAuth);

router.post(
  "/:columnId/tasks",
  validate(createTaskBodySchema),
  createTaskInColumn
);

router.patch("/:columnId/tasks/:taskId", validate(updateTaskBodySchema), updateTaskDetails );

router.get("/:columnId/tasks", getTasksForColumn);

router.delete("/:columnId/tasks/:taskId", deleteTaskFromColumn);

router.get("/:columnId/tasks/:taskId", getTaskById);

export default router;
