import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../lib/prisma.js';
import { createModuleLogger } from '../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = createModuleLogger('solana-listener');

let program: anchor.Program;
let connection: Connection;
let listenerId: number | null = null;
let pollInterval: NodeJS.Timeout | null = null;

export const initSolanaListener = () => {
  try {
    connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    const dummyWallet = {
      publicKey: PublicKey.default,
      signTransaction: () => Promise.reject(),
      signAllTransactions: () => Promise.reject(),
    };
    const provider = new anchor.AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
    anchor.setProvider(provider);

    const idlPath = path.resolve(__dirname, '../../../../target/idl/denft.json');
    const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
    program = new anchor.Program(idl, provider);
    
    // Start WebSocket Listener
    listenerId = program.addEventListener('FileUploaded', async (event, slot, signature) => {
      try {
        log.info({ signature, event }, 'Detected FileUploaded event');
        
        const owner = (event as any).owner.toString();
        // file_hash is an array of numbers, convert to hex string
        const fileHashHex = Buffer.from((event as any).fileHash).toString('hex');

        // Update DB
        const result = await prisma.file.updateMany({
          where: {
            owner: { walletAddress: owner },
            fileHash: fileHashHex,
            onChainStatus: 'pending'
          },
          data: {
            onChainStatus: 'confirmed',
            solanaSignature: signature
          }
        });

        if (result.count > 0) {
          log.info({ fileHash: fileHashHex, signature }, 'Successfully confirmed file on-chain');
        } else {
          log.warn({ fileHash: fileHashHex }, 'FileUploaded event fired but no matching pending file found in DB');
        }
      } catch (err) {
        log.error({ err }, 'Error processing FileUploaded event');
      }
    });

    log.info('Solana WebSocket listener started for FileUploaded events');

    // Start fallback polling cron (every 5 minutes)
    pollInterval = setInterval(pollPendingFiles, 5 * 60 * 1000);
    // Run once immediately
    setTimeout(pollPendingFiles, 5000);

  } catch (error) {
    log.error({ err: error }, 'Failed to initialize Solana listener. Run `anchor build` first.');
  }
};

const pollPendingFiles = async () => {
  if (!program) return;
  
  try {
    // Find files that are still pending
    // Usually we might only want to poll ones older than 1 minute to avoid race conditions with WS
    const pendingFiles = await prisma.file.findMany({
      where: { onChainStatus: 'pending' },
      include: { owner: true }
    });

    if (pendingFiles.length === 0) return;

    log.info(`Polling ${pendingFiles.length} pending files on-chain...`);

    for (const file of pendingFiles) {
      try {
        const fileHashBuffer = Buffer.from(file.fileHash, 'hex');
        const [fileRecordPDA] = PublicKey.findProgramAddressSync(
          [
            Buffer.from('file'),
            new PublicKey(file.owner.walletAddress).toBuffer(),
            fileHashBuffer
          ],
          program.programId
        );

        const accountInfo = await connection.getAccountInfo(fileRecordPDA);
        if (accountInfo) {
          // It exists!
          await prisma.file.update({
            where: { id: file.id },
            data: { onChainStatus: 'confirmed' }
          });
          log.info({ fileId: file.id }, 'Fallback poller confirmed file');
        } else {
          // If it's been pending for over 2 hours, mark it failed to stop checking
          const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
          if (file.uploadedAt < twoHoursAgo) {
            await prisma.file.update({
              where: { id: file.id },
              data: { onChainStatus: 'failed' }
            });
            log.info({ fileId: file.id }, 'Pending file expired, marked as failed');
          }
        }
      } catch (err) {
        log.error({ err, fileId: file.id }, 'Error polling file');
      }
    }
  } catch (error) {
    log.error({ err: error }, 'Error in polling job');
  }
};
