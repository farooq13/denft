import PinoHttp from 'pino-http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { logger } from '../lib/logger.js';
import { env } from '../config/env.js';
import crypto from 'node:crypto';

/**
 * HTTP request logging middleware using Pino.
 * Assigns unique request IDs and logs method, URL, status, and response time.
 */
export const requestLogger = (PinoHttp as unknown as typeof PinoHttp.default)({
  logger,

  // Generate unique request ID for tracing
  genReqId: (req: IncomingMessage) => {
    const existing = req.headers['x-request-id'];
    if (existing) return existing as string;
    return crypto.randomUUID();
  },

  // Custom log level based on status code
  customLogLevel: (
    _req: IncomingMessage,
    res: ServerResponse,
    err: Error | undefined,
  ) => {
    if (err || res.statusCode >= 500) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },

  // Custom success message
  customSuccessMessage: (req: IncomingMessage, res: ServerResponse) => {
    return `${req.method} ${req.url} → ${res.statusCode}`;
  },

  // Custom error message
  customErrorMessage: (
    req: IncomingMessage,
    _res: ServerResponse,
    err: Error,
  ) => {
    return `${req.method} ${req.url} failed: ${err.message}`;
  },

  // Don't log health check requests in production (too noisy)
  autoLogging: {
    ignore: (req: IncomingMessage) => {
      if (env.NODE_ENV === 'production' && req.url === '/api/health') {
        return true;
      }
      return false;
    },
  },
});
