import { Types } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { isMember, isAdmin } from "../utils/boardAuth.js";
import {
  createBoardDoc,
  findBoardsForUser,
  findBoardById,
  saveBoard,
  deleteBoardById,
} from "../dao/board.dao.js";
import { addBoardToUser, pullBoardFromAllUsers } from "../dao/user.dao.js";

export const createBoardService = async(
  creatorUserId: string,
  input: { name: string; type: string; color: string }
) => {
 if (!input?.name || !input?.color || !input?.type) {
    throw new ApiError(400, "All fields name, color, type are required");
  }

  const board = await createBoardDoc({
    name: input.name.trim(),
    type: input.type.trim(),
    color: input.color.trim(),
    createdBy: new Types.ObjectId(creatorUserId),
    creatorMember: { user: new Types.ObjectId(creatorUserId), roles: ["admin"] },
  });

  await addBoardToUser(creatorUserId, board._id as Types.ObjectId);
  return board;
}

export const listBoardsForUser = async(userId: string) => {
  return findBoardsForUser(userId);
}

export const getBoard = async(requestingUserId: string, boardId: string) => {
  const board = await findBoardById(boardId);
  if (!board) throw new ApiError(204, "Board not found");
  if (!isMember(requestingUserId, board)) throw new ApiError(403, "You are not a member of this board");
  return board;
}

export const updateBoardService = async(
  requestingUserId: string,
  boardId: string,
  input: { name?: string; type?: string; color?: string }
) => {
  const board = await findBoardById(boardId);
  if (!board) throw new ApiError(204, "Board not found");
  if (!isAdmin(requestingUserId, board)) throw new ApiError(403, "Only board admins can update the board");

  if (typeof input.name !== "undefined") board.name = input.name;
  if (typeof input.type !== "undefined") board.type = input.type;
  if (typeof input.color !== "undefined") board.color = input.color;

  const saved = await saveBoard(board);
  return saved;
}

export const deleteBoardService = async(requestingUserId: string, boardId: string) => {
  const board = await findBoardById(boardId);
  if (!board) throw new ApiError(204, "Board not found");
  if (!isAdmin(requestingUserId, board)) throw new ApiError(403, "Only board admins can delete the board");

  await deleteBoardById(boardId);
  await pullBoardFromAllUsers(boardId);

  return true;
}
