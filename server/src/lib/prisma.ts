import { PrismaClient } from '@prisma/client';
import { env } from '../config/env.js';
import { createModuleLogger } from './logger.js';

const log = createModuleLogger('prisma');

/**
 * Singleton Prisma client.
 * Logs queries in development mode.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? [
            { emit: 'event', level: 'query' },
            { emit: 'event', level: 'error' },
            { emit: 'event', level: 'warn' },
          ]
        : [{ emit: 'event', level: 'error' }],
  });

// Log queries in development
if (env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    const event = e as { query: string; duration: number };
    log.debug({ query: event.query, duration: `${event.duration}ms` }, 'DB query');
  });
}

prisma.$on('error' as never, (e: unknown) => {
  const event = e as { message: string };
  log.error({ error: event.message }, 'Prisma error');
});

if (env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Graceful shutdown: disconnect Prisma when the process exits.
 */
export async function disconnectPrisma(): Promise<void> {
  log.info('Disconnecting Prisma client…');
  await prisma.$disconnect();
}
