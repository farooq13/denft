import { Router } from 'express';
import * as authController from './auth.controller.js';
import { validate, nonceRequestSchema, verifyRequestSchema } from './auth.validators.js';
import { authenticate } from '../../middleware/auth.js';
import {
  nonceLimiter,
  verifyLimiter,
  refreshLimiter,
  authenticatedLimiter,
} from '../../middleware/rateLimiter.js';

const router = Router();


// Public routes (no JWT required)

/** Request a signing challenge */
router.post(
  '/nonce',
  nonceLimiter,
  validate(nonceRequestSchema),
  authController.requestNonce,
);

/** Verify signature and get tokens */
router.post(
  '/verify',
  verifyLimiter,
  validate(verifyRequestSchema),
  authController.verifySignature,
);

/** Refresh access token (uses httpOnly cookie) */
router.post(
  '/refresh',
  refreshLimiter,
  authController.refreshToken,
);


// Protected routes (JWT required)

/** Logout — invalidate session */
router.post(
  '/logout',
  authenticate,
  authenticatedLimiter,
  authController.logout,
);

/** Get current user profile */
router.get(
  '/me',
  authenticate,
  authenticatedLimiter,
  authController.getMe,
);

export default router;
