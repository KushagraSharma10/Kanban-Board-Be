import { Types } from "mongoose";
import { UserModel } from "../models/user.model.js";
import { BoardModel } from "../models/board.model.js";

export type AssigneeResolveResult = {
  assigneeUserId: Types.ObjectId | null;
  normalizedAssigneeEmail: string | null;
};

export const ensureAssigneeMembershipAndResolveIds = async (
  assigneeEmailFromClient: string | null,
  boardId: string
): Promise<AssigneeResolveResult> => {
  if (!assigneeEmailFromClient || assigneeEmailFromClient.trim() === "") {
    return { assigneeUserId: null, normalizedAssigneeEmail: null };
  }

  const normalizedAssigneeEmail = assigneeEmailFromClient.trim().toLowerCase();
  const boardObjectId = new Types.ObjectId(boardId);

  const userByEmail = await UserModel.findOne({ email: normalizedAssigneeEmail })
    .select<{ _id: Types.ObjectId; email: string }>({ _id: 1, email: 1 })
    .lean();

  if (!userByEmail) {
    throw new Error("Assignee email not found in users");
  }

  const boardDocument = await BoardModel.findById(boardObjectId);
  if (!boardDocument) {
    throw new Error("Board not found");
  }

  const isAlreadyMember = boardDocument.members.some(
    (member) => member.user.toString() === userByEmail._id.toString()
  );
  if (!isAlreadyMember) {
    boardDocument.members.push({ user: userByEmail._id, roles: ["user"] });
    await boardDocument.save();
  }

  await UserModel.updateOne(
    { _id: userByEmail._id },
    { $addToSet: { boards: boardObjectId } }
  );

  return {
    assigneeUserId: userByEmail._id,
    normalizedAssigneeEmail,
  };
};
