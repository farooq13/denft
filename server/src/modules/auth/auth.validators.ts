import { z } from 'zod';

// ──────────────────────────────────────────────
// Request Validation Schemas
// ──────────────────────────────────────────────

/**
 * POST /api/auth/nonce
 * Request a signing challenge for a wallet.
 */
export const nonceRequestSchema = z.object({
  walletAddress: z
    .string()
    .min(32, 'Wallet address too short')
    .max(44, 'Wallet address too long')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Base58 wallet address'),
});

export type NonceRequest = z.infer<typeof nonceRequestSchema>;

/**
 * POST /api/auth/verify
 * Verify a signed message to authenticate.
 */
export const verifyRequestSchema = z.object({
  walletAddress: z
    .string()
    .min(32, 'Wallet address too short')
    .max(44, 'Wallet address too long')
    .regex(/^[1-9A-HJ-NP-Za-km-z]+$/, 'Invalid Base58 wallet address'),
  signature: z
    .array(z.number().int().min(0).max(255))
    .length(64, 'Signature must be exactly 64 bytes'),
  message: z
    .string()
    .min(1, 'Message is required')
    .max(1000, 'Message too long'),
  walletName: z.string().optional(),
  network: z.string().optional(),
});

export type VerifyRequest = z.infer<typeof verifyRequestSchema>;

// ──────────────────────────────────────────────
// Validation Middleware Helper
// ──────────────────────────────────────────────

import type { Request, Response, NextFunction } from 'express';

/**
 * Creates an Express middleware that validates `req.body` against a Zod schema.
 * Returns 400 with structured errors if validation fails.
 */
export function validate<T extends z.ZodSchema>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body',
          details: fieldErrors,
        },
      });
      return;
    }

    // Replace body with parsed (and typed) data
    req.body = result.data;
    next();
  };
}
