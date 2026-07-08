import pino from 'pino';
import { env } from '../config/env.js';

/**
 * Structured logger using Pino.
 * Pretty-prints in development, JSON in production.
 */
export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV !== 'production'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  // Redact sensitive fields from logs
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    censor: '[REDACTED]',
  },
});

/**
 * Create a child logger scoped to a specific module.
 * Usage: const log = createModuleLogger('auth');
 */
export function createModuleLogger(module: string) {
  return logger.child({ module });
}
