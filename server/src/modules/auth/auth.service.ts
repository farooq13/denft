import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { verifySignature, isValidPublicKey, buildSignMessage } from '../../lib/solana.js';
import { env } from '../../config/env.js';
import { createModuleLogger } from '../../lib/logger.js';
import { AppError } from '../../middleware/errorHandler.js';
import type { JwtPayload, NonceResponse, AuthTokenResponse } from '../../types/index.js';

const log = createModuleLogger('auth-service');

// ──────────────────────────────────────────────
// Nonce Management
// ──────────────────────────────────────────────

/**
 * Generate a cryptographic nonce and store it in Redis with a TTL.
 * Returns the nonce and the structured message the wallet must sign.
 */
export async function generateNonce(walletAddress: string): Promise<NonceResponse> {
  if (!isValidPublicKey(walletAddress)) {
    throw new AppError('Invalid wallet address', 400, 'INVALID_WALLET');
  }

  const nonce = crypto.randomBytes(32).toString('hex');
  const redisKey = `nonce:${walletAddress}`;

  // Store nonce with TTL
  await redis.setex(redisKey, env.NONCE_TTL, nonce);

  const message = buildSignMessage(walletAddress, nonce);

  log.debug({ walletAddress }, 'Nonce generated');

  return {
    nonce,
    message,
    expiresIn: env.NONCE_TTL,
  };
}

// ──────────────────────────────────────────────
// Signature Verification & Authentication
// ──────────────────────────────────────────────

/**
 * Verify a wallet signature, create/update user, and issue tokens.
 */
export async function verifyAndAuthenticate(params: {
  walletAddress: string;
  signature: number[];
  message: string;
  walletName?: string;
  ipAddress?: string;
  userAgent?: string;
}): Promise<AuthTokenResponse & { refreshToken: string }> {
  const { walletAddress, signature, message, walletName, ipAddress, userAgent } = params;

  // 1. Validate wallet address
  if (!isValidPublicKey(walletAddress)) {
    throw new AppError('Invalid wallet address', 400, 'INVALID_WALLET');
  }

  // 2. Retrieve and validate nonce from Redis
  const redisKey = `nonce:${walletAddress}`;
  const storedNonce = await redis.get(redisKey);

  if (!storedNonce) {
    throw new AppError(
      'Nonce expired or not found. Please request a new one.',
      401,
      'NONCE_EXPIRED',
    );
  }

  // Verify the nonce is contained in the message
  if (!message.includes(storedNonce)) {
    throw new AppError('Invalid message — nonce mismatch', 401, 'NONCE_MISMATCH');
  }

  // 3. Verify Ed25519 signature
  const signatureBytes = new Uint8Array(signature);
  const isValid = verifySignature(message, signatureBytes, walletAddress);

  if (!isValid) {
    log.warn({ walletAddress }, 'Invalid signature attempt');
    throw new AppError('Signature verification failed', 401, 'INVALID_SIGNATURE');
  }

  // 4. Consume nonce (single-use)
  await redis.del(redisKey);

  // 5. Upsert user in database
  const user = await prisma.user.upsert({
    where: { walletAddress },
    create: {
      walletAddress,
      displayName: null,
      avatarUrl: null,
    },
    update: {
      // Touch updatedAt on re-login
      updatedAt: new Date(),
    },
    select: {
      id: true,
      walletAddress: true,
      displayName: true,
      avatarUrl: true,
      isActive: true,
      createdAt: true,
    },
  });

  if (!user.isActive) {
    throw new AppError('User account is inactive', 403, 'ACCOUNT_INACTIVE');
  }

  // 6. Generate JWT tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    walletAddress: user.walletAddress,
  });

  const refreshToken = generateRefreshToken();

  // 7. Store session with hashed refresh token
  const hashedRefreshToken = hashToken(refreshToken);

  // Calculate refresh token expiry
  const refreshExpiry = parseExpiry(env.JWT_REFRESH_EXPIRY);

  await prisma.session.create({
    data: {
      userId: user.id,
      refreshToken: hashedRefreshToken,
      walletAddress: user.walletAddress,
      walletName: walletName ?? null,
      ipAddress: ipAddress ?? null,
      userAgent: userAgent ?? null,
      expiresAt: new Date(Date.now() + refreshExpiry),
    },
  });

  log.info({ walletAddress, userId: user.id }, 'User authenticated');

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      walletAddress: user.walletAddress,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    },
  };
}

// ──────────────────────────────────────────────
// Token Refresh
// ──────────────────────────────────────────────

/**
 * Refresh an access token using a valid refresh token.
 * Implements token rotation: old refresh token is invalidated.
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const hashedToken = hashToken(refreshToken);

  // Find session by hashed refresh token
  const session = await prisma.session.findUnique({
    where: { refreshToken: hashedToken },
    include: {
      user: {
        select: {
          id: true,
          walletAddress: true,
          isActive: true,
        },
      },
    },
  });

  if (!session) {
    throw new AppError('Invalid refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  // Check expiration
  if (session.expiresAt < new Date()) {
    // Clean up expired session
    await prisma.session.delete({ where: { id: session.id } });
    throw new AppError('Refresh token expired', 401, 'REFRESH_TOKEN_EXPIRED');
  }

  // Check user is still active
  if (!session.user.isActive) {
    await prisma.session.delete({ where: { id: session.id } });
    throw new AppError('User account is inactive', 403, 'ACCOUNT_INACTIVE');
  }

  // Token rotation: delete old session, create new one
  const newRefreshToken = generateRefreshToken();
  const newHashedRefreshToken = hashToken(newRefreshToken);
  const refreshExpiry = parseExpiry(env.JWT_REFRESH_EXPIRY);

  await prisma.$transaction([
    prisma.session.delete({ where: { id: session.id } }),
    prisma.session.create({
      data: {
        userId: session.user.id,
        refreshToken: newHashedRefreshToken,
        walletAddress: session.walletAddress,
        walletName: session.walletName,
        ipAddress: session.ipAddress,
        userAgent: session.userAgent,
        expiresAt: new Date(Date.now() + refreshExpiry),
      },
    }),
  ]);

  const newAccessToken = generateAccessToken({
    userId: session.user.id,
    walletAddress: session.user.walletAddress,
  });

  log.debug({ userId: session.user.id }, 'Token refreshed');

  return {
    accessToken: newAccessToken,
    refreshToken: newRefreshToken,
  };
}

// ──────────────────────────────────────────────
// Logout
// ──────────────────────────────────────────────

/**
 * Invalidate a session by deleting the refresh token record.
 */
export async function logout(userId: string, refreshToken?: string): Promise<void> {
  if (refreshToken) {
    const hashedToken = hashToken(refreshToken);
    await prisma.session.deleteMany({
      where: { userId, refreshToken: hashedToken },
    });
  } else {
    // If no refresh token provided, delete all sessions for this user
    await prisma.session.deleteMany({ where: { userId } });
  }

  log.info({ userId }, 'User logged out');
}

// ──────────────────────────────────────────────
// User Profile
// ──────────────────────────────────────────────

/**
 * Get the full user profile by ID.
 */
export async function getUserProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      walletAddress: true,
      displayName: true,
      avatarUrl: true,
      fileCount: true,
      storageUsed: true,
      storageLimit: true,
      fileLimit: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new AppError('User not found', 404, 'USER_NOT_FOUND');
  }

  return user;
}

// ──────────────────────────────────────────────
// Internal Helpers
// ──────────────────────────────────────────────

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRY as string & { __brand: 'StringValue' },
  } as jwt.SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(48).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

/**
 * Parse a time string like "15m", "7d", "1h" into milliseconds.
 */
function parseExpiry(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

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
