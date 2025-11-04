import { Router } from "express";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validate } from "../middlewares/validate.middleware.js";
import {
  createBoardSchema,
  updateBoardSchema,
} from "../validators/board.schema.js";
import {
  createBoard,
  getMyBoards,
  getBoardById,
  updateBoard,
  deleteBoard,
} from "../controllers/board.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/", getMyBoards);
router.get("/:id", getBoardById);
router.post("/", validate(createBoardSchema), createBoard);
router.patch("/:id", validate(updateBoardSchema), updateBoard);
router.delete("/:id", deleteBoard);

export default router;
