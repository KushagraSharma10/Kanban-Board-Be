import type {
  Request as ExpressRequest,
  Response as ExpressResponse,
  NextFunction,
} from "express";
import type { AsyncHandler } from "../types/asyncHandler";

export const asyncHandler =
  (handler: AsyncHandler) =>
  (req: ExpressRequest, res: ExpressResponse, next: NextFunction) => {
    handler(req, res, next).catch(next);
  };
