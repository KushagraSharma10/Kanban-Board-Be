import { Router } from "express";
import * as boardController from "../controllers/board.controller.js";

const router = Router();

router.get("/", boardController.getBoards);

router.post("/", boardController.createBoard);

router.get("/:id", boardController.getBoardById);

router.patch("/:id", boardController.updateBoard);

router.delete("/:id", boardController.deleteBoard);

export default router;