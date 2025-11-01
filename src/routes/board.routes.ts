import { Router } from "express";
import {
  createBoard,
  deleteBoard,
  getBoardById,
  getBoards,
  updateBoard,
} from "../controllers/board.controller.js";

const router = Router();

router.get("/", getBoards);

router.post("/", createBoard);

router.get("/:id", getBoardById);

router.patch("/:id", updateBoard);

router.delete("/:id", deleteBoard);

export default router;
