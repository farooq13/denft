import { Connection, PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import bs58 from 'bs58';
import { env } from '../config/env.js';
import { createModuleLogger } from './logger.js';

const log = createModuleLogger('solana');

/**
 * Solana RPC connection (devnet by default).
 */
export const solanaConnection = new Connection(env.SOLANA_RPC_URL, 'confirmed');

/**
 * Verify an Ed25519 signature from a Solana wallet.
 *
 * @param message  - The original message that was signed (UTF-8 string)
 * @param signature - The signature bytes (Uint8Array, length 64)
 * @param publicKey - The signer's Base58-encoded public key
 * @returns true if the signature is valid
 */
export function verifySignature(
  message: string,
  signature: Uint8Array,
  publicKey: string,
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const publicKeyBytes = bs58.decode(publicKey);

    return nacl.sign.detached.verify(messageBytes, signature, publicKeyBytes);
  } catch (err) {
    log.warn({ err, publicKey }, 'Signature verification failed');
    return false;
  }
}

/**
 * Check if a string is a valid Solana public key (Base58, 32 bytes).
 */
export function isValidPublicKey(address: string): boolean {
  try {
    const key = new PublicKey(address);
    return PublicKey.isOnCurve(key.toBytes());
  } catch {
    return false;
  }
}

/**
 * Generate the structured challenge message for SIWS.
 */
export function buildSignMessage(walletAddress: string, nonce: string): string {
  return [
    'Welcome to Denft!',
    '',
    'Sign this message to verify wallet ownership.',
    'This will not trigger a blockchain transaction or cost any fees.',
    '',
    `Wallet: ${walletAddress}`,
    `Nonce: ${nonce}`,
    `Issued At: ${new Date().toISOString()}`,
  ].join('\n');
}
