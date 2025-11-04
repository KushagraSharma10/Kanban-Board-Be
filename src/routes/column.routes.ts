import { Router } from "express";
import { validate } from "../middlewares/validate.middleware.js";
import {
  getColumnsForBoard,
  createColumn,
  updateColumn,
  deleteColumn,
  reorderColumns,
  getSingleColumn,
} from "../controllers/column.controller.js";
import {
  createColumnSchema,
  reorderSchema,
  updateColumnSchema,
} from "../validators/column.schema.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router({ mergeParams: true });
router.use(requireAuth);

router.get("/", getColumnsForBoard);

router.get("/:columnId", getSingleColumn);

router.post("/", validate(createColumnSchema), createColumn);

router.patch("/:columnId", validate(updateColumnSchema), updateColumn);

router.delete("/:columnId", deleteColumn);

router.patch("/reorder", validate(reorderSchema), reorderColumns);

export default router;
