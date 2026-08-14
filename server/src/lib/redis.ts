import { Redis } from 'ioredis';
import { env } from '../config/env.js';
import { createModuleLogger } from './logger.js';

const log = createModuleLogger('redis');

// ──────────────────────────────────────────────
// In-Memory Fallback Store
// Used when REDIS_URL is not configured (local dev)
// ──────────────────────────────────────────────

interface MemoryEntry {
  value: string;
  expiresAt: number | null;
}

class MemoryStore {
  private store = new Map<string, MemoryEntry>();

  async get(key: string): Promise<string | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  async set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    const expiresAt =
      mode === 'EX' && ttl ? Date.now() + ttl * 1000 : null;
    this.store.set(key, { value, expiresAt });
    return 'OK';
  }

  async setex(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.set(key, value, 'EX', seconds);
  }

  async del(key: string): Promise<number> {
    return this.store.delete(key) ? 1 : 0;
  }

  async exists(key: string): Promise<number> {
    const val = await this.get(key); // triggers TTL check
    return val !== null ? 1 : 0;
  }

  async incr(key: string): Promise<number> {
    const current = await this.get(key);
    const next = (parseInt(current ?? '0', 10) || 0) + 1;
    const entry = this.store.get(key);
    this.store.set(key, {
      value: String(next),
      expiresAt: entry?.expiresAt ?? null,
    });
    return next;
  }

  async expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return 0;
    entry.expiresAt = Date.now() + seconds * 1000;
    return 1;
  }

  async quit(): Promise<'OK'> {
    this.store.clear();
    return 'OK';
  }
}

// ──────────────────────────────────────────────
// Redis Client Factory
// ──────────────────────────────────────────────

export type RedisLike = Redis | MemoryStore;

let redisClient: RedisLike;

if (env.REDIS_URL) {
  log.info('Connecting to Redis (Upstash)…');
  const client = new Redis(env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      log.warn({ attempt: times, delay }, 'Redis reconnecting…');
      return delay;
    },
    tls: env.REDIS_URL.startsWith('rediss://') ? {} : undefined,
  });

  client.on('connect', () => log.info('Redis connected'));
  client.on('error', (err: Error) => log.error({ err }, 'Redis error'));
  client.on('close', () => log.warn('Redis connection closed'));

  redisClient = client;
} else {
  log.info('No REDIS_URL configured — using in-memory store (dev only)');
  redisClient = new MemoryStore();
}

export const redis = redisClient;

/**
 * Graceful shutdown: disconnect Redis when the process exits.
 */
export async function disconnectRedis(): Promise<void> {
  log.info('Disconnecting Redis…');
  await redis.quit();
}
