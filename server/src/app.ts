import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import { requestLogger } from './middleware/requestLogger.js';
import { globalErrorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { globalLimiter } from './middleware/rateLimiter.js';
import { prisma } from './lib/prisma.js';
import { redis } from './lib/redis.js';
import { createModuleLogger } from './lib/logger.js';

// Route imports
import authRoutes from './modules/auth/auth.routes.js';

const log = createModuleLogger('app');

/**
 * Create and configure the Express application.
 */
export function createApp() {
  const app = express();

  // ────────────────────────────────────────────
  // Security & Parsing Middleware
  // ────────────────────────────────────────────

  // Security headers
  app.set('trust proxy', 1); // Trust first proxy (Render)

  app.use(helmet({
    contentSecurityPolicy: env.NODE_ENV === 'production' ? undefined : false,
  }));

  // CORS
  app.use(cors({
    origin: env.CORS_ORIGIN.split(',').map(o => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Cookie parsing (for refresh tokens)
  app.use(cookieParser());

  // Request logging
  app.use(requestLogger);

  // Global rate limiter
  app.use('/api', globalLimiter);

  // ────────────────────────────────────────────
  // Health Check
  // ────────────────────────────────────────────

  app.get('/api/health', async (_req, res) => {
    const healthCheck = {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV,
      services: {
        database: 'unknown' as string,
        redis: 'unknown' as string,
      },
    };

    // Check database connectivity
    try {
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.services.database = 'connected';
    } catch {
      healthCheck.services.database = 'disconnected';
      healthCheck.status = 'degraded';
    }

    // Check Redis connectivity
    try {
      const pong = await redis.get('__health__');
      healthCheck.services.redis = pong !== undefined ? 'connected' : 'connected';
    } catch {
      healthCheck.services.redis = 'disconnected';
      healthCheck.status = 'degraded';
    }

    const statusCode = healthCheck.status === 'ok' ? 200 : 503;
    res.status(statusCode).json({
      success: true,
      data: healthCheck,
    });
  });

  // ────────────────────────────────────────────
  // API Routes
  // ────────────────────────────────────────────

  app.use('/api/auth', authRoutes);

  // ────────────────────────────────────────────
  // Error Handling (must be after routes)
  // ────────────────────────────────────────────

  app.use(notFoundHandler);
  app.use(globalErrorHandler);

  log.info('Express app configured');

  return app;
}
