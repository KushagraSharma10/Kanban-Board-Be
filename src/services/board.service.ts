import * as fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { Board } from "../interfaces/boards";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOARDS_FILE_PATH = path.join(__dirname, "..", "data", "boards.json");

export const readBoardsFromFile = async (): Promise<Board[]> => {
  try {
    const jsonData = await fs.readFile(BOARDS_FILE_PATH, "utf-8");
    return JSON.parse(jsonData) as Board[];
  } catch (error) {
    const fileError = error as NodeJS.ErrnoException;
    if (fileError.code === "ENOENT") {
      return [];
    }
    throw new ApiError(500, "Failed to read boards data");
  }
};

const writeBoardsToFile = async (boards: Board[]): Promise<void> => {
  try {
    await fs.writeFile(BOARDS_FILE_PATH, JSON.stringify(boards, null, 2));
  } catch (error) {
    throw new ApiError(500, "Failed to persist boards data");
  }
};

export const findBoardById = async (id: string): Promise<Board | null> => {
  try {
    const existingBoards = await readBoardsFromFile();
    return existingBoards.find((board) => board.id === id) || null;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to fetch board by id");
  }
};

export const addNewBoard = async (
  name: string,
  color: string
): Promise<Board> => {
  try {
    const existingBoards = await readBoardsFromFile();

    const isDuplicate = existingBoards.some((board) => board.name === name);
    if (isDuplicate) {
      throw new ApiError(409, "Board with this name already exists");
    }

    const newBoard: Board = { id: nanoid(), name, color };
    existingBoards.push(newBoard);
    await writeBoardsToFile(existingBoards);

    return newBoard;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to create board");
  }
};

export const modifyBoardById = async (
  boardId: string,
  updatedFields: Partial<Board>
): Promise<Board | null> => {
  try {
    const existingBoards = await readBoardsFromFile();
    let updatedBoardData: Board | null = null;

    const updatedBoardsList = existingBoards.map((currentBoard) => {
      if (currentBoard.id !== boardId) return currentBoard;

      const mergedBoard: Board = {
        id: boardId,
        name: updatedFields.name ?? currentBoard.name,
        color: updatedFields.color ?? currentBoard.color,
      };

      updatedBoardData = mergedBoard;
      return mergedBoard;
    });

    if (!updatedBoardData) {
      return null;
    }

    await writeBoardsToFile(updatedBoardsList);
    return updatedBoardData;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to update board");
  }
};

export const removeBoardById = async (id: string): Promise<boolean> => {
  try {
    const existingBoards = await readBoardsFromFile();
    const initialLength = existingBoards.length;
    const newBoards = existingBoards.filter((board) => board.id !== id);

    if (newBoards.length === initialLength) {
      return false;
    }

    await writeBoardsToFile(newBoards);
    return true;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(500, "Failed to delete board");
  }
};
