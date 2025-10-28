import { ErrorRequestHandler } from "express";
import { ApiError } from "../utils/ApiError.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const statusCode = err instanceof ApiError ? err.statusCode : 500;

  const message = err instanceof Error ? err.message : "Internal server error";

  res.status(statusCode).json({
    success: false,
    message,
    path: req.originalUrl,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
};
