import * as fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";
import { fileURLToPath } from "url";
import { Board } from "../interfaces/boards";
import { ApiError } from "../utils/ApiError.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BOARDS_FILE_PATH = path.join(__dirname, "..", "data", "boards.json");

const readBoardsFromFile = async (): Promise<Board[]> => {
  try {
    const jsonData = await fs.readFile(BOARDS_FILE_PATH, "utf-8");
    return JSON.parse(jsonData) as Board[];
  } catch (error) {
    const Error = error as NodeJS.ErrnoException;
    if (Error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
};

const writeBoardsToFile = async (boards: Board[]): Promise<void> => {
  await fs.writeFile(BOARDS_FILE_PATH, JSON.stringify(boards, null, 2));
};

export const getBoardsService = async (): Promise<Board[]> => {
  return readBoardsFromFile();
};

export const getBoardByIdService = async (
  id: string
): Promise<Board | null> => {
  const boards = await readBoardsFromFile();
  return boards.find((board) => board.id === id) || null;
};

export const createBoardService = async (
  name: string,
  color: string
): Promise<Board> => {
  const boards = await readBoardsFromFile();

  const isDuplicate = boards.some((board) => board.name === name);
  if (isDuplicate) {
    throw new ApiError(409, "Board with this name already exists");
  }

  const newBoard: Board = {
    id: nanoid(),
    name,
    color,
  };

  boards.push(newBoard);
  await writeBoardsToFile(boards);

  return newBoard;
};

export const updateBoardService = async (
  id: string,
  updates: Partial<Board>
): Promise<Board | null> => {
  const boards = await readBoardsFromFile();

  let updatedBoard: Board | null = null;

  const newBoards = boards.map((board) => {
    if (board.id !== id) return board;

    const merged: Board = {
      id,
      name: updates.name !== undefined ? updates.name : board.name,
      color: updates.color !== undefined ? updates.color : board.color,
    };

    updatedBoard = merged;
    return merged;
  });

  if (!updatedBoard) {
    return null;
  }

  await writeBoardsToFile(newBoards);
  return updatedBoard;
};

export const deleteBoardService = async (id: string): Promise<boolean> => {
  const boards = await readBoardsFromFile();

  const initialLength = boards.length;
  const newBoards = boards.filter((board) => board.id !== id);

  if (newBoards.length === initialLength) {
    return false;
  }

  await writeBoardsToFile(newBoards);
  return true;
};
