import type { Request, Response, NextFunction } from 'express';
import * as authService from './auth.service.js';
import { createModuleLogger } from '../../lib/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';
import type { NonceRequest, VerifyRequest } from './auth.validators.js';
import { env } from '../../config/env.js';

const log = createModuleLogger('auth-controller');


// POST /api/auth/nonce

export async function requestNonce(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { walletAddress } = req.body as NonceRequest;
    const result = await authService.generateNonce(walletAddress);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/verify

export async function verifySignature(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const body = req.body as VerifyRequest;

    const result = await authService.verifyAndAuthenticate({
      walletAddress: body.walletAddress,
      signature: body.signature,
      message: body.message,
      walletName: body.walletName,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    // Set refresh token as httpOnly cookie
    const refreshMaxAge = parseMs(env.JWT_REFRESH_EXPIRY);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: refreshMaxAge,
      path: '/api/auth',
    });

    // Don't send refreshToken in the JSON response body
    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
        user: result.user,
      },
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/refresh

export async function refreshToken(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: 'No refresh token provided',
        },
      });
      return;
    }

    const result = await authService.refreshAccessToken(token);

    // Set new refresh token cookie (rotation)
    const refreshMaxAge = parseMs(env.JWT_REFRESH_EXPIRY);

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: refreshMaxAge,
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      data: {
        accessToken: result.accessToken,
      },
    });
  } catch (err) {
    next(err);
  }
}


// POST /api/auth/logout

export async function logout(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const refreshTokenCookie = req.cookies?.refreshToken;

    await authService.logout(userId, refreshTokenCookie);

    // Clear the refresh token cookie
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax',
      path: '/api/auth',
    });

    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  } catch (err) {
    next(err);
  }
}


// GET /api/auth/me

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { userId } = (req as AuthenticatedRequest).user;
    const user = await authService.getUserProfile(userId);

    // Serialize BigInt to string for JSON response
    res.status(200).json({
      success: true,
      data: {
        ...user,
        storageUsed: user.storageUsed.toString(),
        storageLimit: user.storageLimit.toString(),
      },
    });
  } catch (err) {
    next(err);
  }
}

// Helper

function parseMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers: Record<string, number> = {
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
  };

  return value * multipliers[unit];
}
