import rateLimit from 'express-rate-limit';
import { createModuleLogger } from '../lib/logger.js';

const log = createModuleLogger('rate-limiter');

/**
 * Factory to create rate limiters with consistent configuration.
 */
function createLimiter(options: {
  windowMs: number;
  max: number;
  name: string;
}) {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    standardHeaders: true,  // Return rate limit info in `RateLimit-*` headers
    legacyHeaders: false,   // Disable `X-RateLimit-*` headers
    message: {
      success: false,
      error: {
        code: 'RATE_LIMITED',
        message: `Too many requests. Please try again later.`,
      },
    },
    handler: (_req, res, _next, opts) => {
      log.warn({ limiter: options.name, ip: _req.ip }, 'Rate limit exceeded');
      res.status(429).json(opts.message);
    },
    keyGenerator: (req) => {
      // Use X-Forwarded-For in production (behind Render proxy)
      return req.ip || req.socket.remoteAddress || 'unknown';
    },
  });
}

// ──────────────────────────────────────────────
// Pre-configured Rate Limiters
// ──────────────────────────────────────────────

/** Global API rate limit: 100 requests per 15 minutes */
export const globalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  name: 'global',
});

/** Auth nonce endpoint: 10 requests per minute */
export const nonceLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  name: 'auth-nonce',
});

/** Auth verify endpoint: 5 requests per minute (stricter) */
export const verifyLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 5,
  name: 'auth-verify',
});

/** Auth refresh endpoint: 10 requests per minute */
export const refreshLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 10,
  name: 'auth-refresh',
});

/** General authenticated endpoints: 30 requests per minute */
export const authenticatedLimiter = createLimiter({
  windowMs: 60 * 1000,
  max: 30,
  name: 'authenticated',
});
