import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './lib/logger.js';
import { disconnectPrisma } from './lib/prisma.js';
import { disconnectRedis } from './lib/redis.js';

const app = createApp();


import { initSolanaListener } from './services/solanaListener.js';

// Initialize Background Services
initSolanaListener();

// Start Server

const server = app.listen(env.PORT, () => {
  logger.info(
    {
      port: env.PORT,
      env: env.NODE_ENV,
      solana: env.SOLANA_NETWORK,
    },
    `Denft server running on http://localhost:${env.PORT}`,
  );
});


// Graceful Shutdown

const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

for (const signal of signals) {
  process.on(signal, async () => {
    logger.info({ signal }, 'Shutdown signal received');

    // Stop accepting new connections
    server.close(async () => {
      logger.info('HTTP server closed');

      // Disconnect services
      await Promise.allSettled([
        disconnectPrisma(),
        disconnectRedis(),
      ]);

      logger.info('All services disconnected. Goodbye.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  });
}

// Unhandled Errors

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled Promise Rejection');
});

process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught Exception — shutting down');
  process.exit(1);
});
