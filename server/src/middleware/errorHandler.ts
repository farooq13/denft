import type { Request, Response, NextFunction } from 'express';
import { env } from '../config/env.js';
import { createModuleLogger } from '../lib/logger.js';

const log = createModuleLogger('error-handler');

// ──────────────────────────────────────────────
// Custom Application Error
// ──────────────────────────────────────────────

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

// Common error factory functions
export const errors = {
  badRequest: (message: string, code = 'BAD_REQUEST') =>
    new AppError(message, 400, code),
  unauthorized: (message = 'Unauthorized', code = 'UNAUTHORIZED') =>
    new AppError(message, 401, code),
  forbidden: (message = 'Forbidden', code = 'FORBIDDEN') =>
    new AppError(message, 403, code),
  notFound: (message = 'Resource not found', code = 'NOT_FOUND') =>
    new AppError(message, 404, code),
  conflict: (message: string, code = 'CONFLICT') =>
    new AppError(message, 409, code),
  tooManyRequests: (message = 'Too many requests', code = 'RATE_LIMITED') =>
    new AppError(message, 429, code),
  internal: (message = 'Internal server error', code = 'INTERNAL_ERROR') =>
    new AppError(message, 500, code, false),
};

// ──────────────────────────────────────────────
// Global Error Handler Middleware
// ──────────────────────────────────────────────

export function globalErrorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Handle known operational errors
  if (err instanceof AppError) {
    if (!err.isOperational) {
      log.error({ err, code: err.code }, 'Non-operational error');
    } else {
      log.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    }

    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code,
        message: err.message,
        ...(env.NODE_ENV === 'development' && { stack: err.stack }),
      },
    });
    return;
  }

  // Handle unknown errors
  log.error({ err }, 'Unhandled error');

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred'
          : err.message,
      ...(env.NODE_ENV === 'development' && { stack: err.stack }),
    },
  });
}

// ──────────────────────────────────────────────
// 404 Handler
// ──────────────────────────────────────────────

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}
