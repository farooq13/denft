import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { createModuleLogger } from '../lib/logger.js';
import type { JwtPayload, AuthenticatedRequest } from '../types/index.js';

const log = createModuleLogger('auth-middleware');

/**
 * JWT authentication middleware.
 * Verifies the Bearer token from the Authorization header
 * and attaches the decoded user payload to `req.user`.
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      success: false,
      error: {
        code: 'UNAUTHORIZED',
        message: 'Missing or invalid authorization header',
      },
    });
    return;
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    // Attach user to request
    (req as AuthenticatedRequest).user = {
      userId: decoded.userId,
      walletAddress: decoded.walletAddress,
    };

    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      log.debug({ walletAddress: 'unknown' }, 'Access token expired');
      res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Access token has expired. Please refresh.',
        },
      });
      return;
    }

    if (err instanceof jwt.JsonWebTokenError) {
      log.warn({ err }, 'Invalid JWT token');
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid access token',
        },
      });
      return;
    }

    log.error({ err }, 'Unexpected auth error');
    res.status(500).json({
      success: false,
      error: {
        code: 'AUTH_ERROR',
        message: 'Authentication failed',
      },
    });
  }
}
