import { z } from 'zod';

/**
 * Zod-validated environment configuration.
 * Throws at startup if required variables are missing or malformed.
 */
const envSchema = z.object({
  // Server
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Database (Neon)
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // Redis (Upstash — optional in development)
  REDIS_URL: z.string().optional().default(''),

  // JWT
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(32, 'JWT_REFRESH_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),

  // Solana
  SOLANA_RPC_URL: z
    .string()
    .url()
    .default('https://api.devnet.solana.com'),
  SOLANA_NETWORK: z
    .enum(['devnet', 'testnet', 'mainnet-beta'])
    .default('devnet'),

  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  // Pinata IPFS
  PINATA_JWT: z.string().min(10, 'PINATA_JWT is required for IPFS pinning'),
  PINATA_GATEWAY: z.string().url().default('https://gateway.pinata.cloud'),

  // Nonce TTL (seconds)
  NONCE_TTL: z.coerce.number().default(300),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const formatted = result.error.flatten().fieldErrors;
    console.error('❌ Invalid environment variables:', formatted);
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
