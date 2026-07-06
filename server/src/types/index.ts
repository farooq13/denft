import type { Request } from 'express';

// ──────────────────────────────────────────────
// JWT Payload
// ──────────────────────────────────────────────

export interface JwtPayload {
  userId: string;
  walletAddress: string;
}

/**
 * Augmented Express Request with authenticated user data.
 * Available after the `authenticate` middleware runs.
 */
export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

// ──────────────────────────────────────────────
// API Response Envelopes
// ──────────────────────────────────────────────

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

// ──────────────────────────────────────────────
// Auth DTOs
// ──────────────────────────────────────────────

export interface NonceResponse {
  nonce: string;
  message: string;
  expiresIn: number;
}

export interface AuthTokenResponse {
  accessToken: string;
  user: {
    id: string;
    walletAddress: string;
    displayName: string | null;
    avatarUrl: string | null;
    createdAt: Date;
  };
}

export interface UserProfile {
  id: string;
  walletAddress: string;
  displayName: string | null;
  avatarUrl: string | null;
  fileCount: number;
  storageUsed: bigint;
  storageLimit: bigint;
  fileLimit: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
