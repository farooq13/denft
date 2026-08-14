import { Connection, PublicKey } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { prisma } from '../../lib/prisma.js';
import { createModuleLogger } from '../../lib/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const log = createModuleLogger('verify-service');

// Initialize Anchor Provider
const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
// We provide a dummy wallet since we only need read access
const dummyWallet = {
  publicKey: PublicKey.default,
  signTransaction: () => Promise.reject(),
  signAllTransactions: () => Promise.reject(),
};
const provider = new anchor.AnchorProvider(connection, dummyWallet as any, { commitment: 'confirmed' });
anchor.setProvider(provider);

// Load IDL
let program: anchor.Program;
try {
  const idlPath = path.resolve(__dirname, '../../../../../target/idl/denft.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf8'));
  program = new anchor.Program(idl, provider);
} catch (error) {
  log.warn('Could not load Anchor IDL. Verification will be disabled. Run `anchor build` first.');
}

export class VerifyService {
  /**
   * Verifies a file's authenticity by comparing DB record with on-chain data
   * @param fileId UUID of the file in the database
   */
  static async verifyFile(fileId: string) {
    if (!program) {
      throw new Error('Verification is currently unavailable (IDL not loaded)');
    }

    // 1. Fetch from Database
    const dbFile = await prisma.file.findUnique({
      where: { id: fileId },
      include: { owner: true }
    });

    if (!dbFile) {
      throw new Error('FILE_NOT_FOUND');
    }

    // 2. Derive PDA for the FileRecord
    const fileHashBuffer = Buffer.from(dbFile.fileHash, 'hex');
    const [fileRecordPDA] = PublicKey.findProgramAddressSync(
      [
        Buffer.from('file'),
        new PublicKey(dbFile.owner.walletAddress).toBuffer(),
        fileHashBuffer
      ],
      program.programId
    );

    // 3. Fetch from Solana Blockchain
    let onChainData: any;
    try {
      onChainData = await program.account.fileRecord.fetch(fileRecordPDA);
    } catch (error) {
      log.warn({ err: error, fileId }, 'Failed to fetch PDA. It might not exist on-chain yet.');
      return {
        isAuthentic: false,
        confidence: 0,
        message: 'File record not found on the blockchain. It may still be pending.',
        databaseRecord: {
          fileHash: dbFile.fileHash,
          onChainStatus: dbFile.onChainStatus
        }
      };
    }

    // 4. Compare metadata
    const sizeMatch = onChainData.fileSize.toString() === dbFile.fileSize.toString();
    const ipfsHashMatch = onChainData.ipfsHash === dbFile.ipfsHash;
    const contentTypeMatch = onChainData.contentType === dbFile.contentType;
    
    // Hash is embedded in the PDA derivation, so if we found it, the hash matches the owner exactly.
    const hashMatch = true; 

    const isAuthentic = sizeMatch && ipfsHashMatch && contentTypeMatch && hashMatch;
    
    let confidence = 0;
    if (isAuthentic) {
      confidence = 1.0;
    } else {
      confidence = [sizeMatch, ipfsHashMatch, contentTypeMatch, hashMatch].filter(Boolean).length / 4;
    }

    // Update DB status if it was pending
    if (dbFile.onChainStatus === 'pending') {
      await prisma.file.update({
        where: { id: dbFile.id },
        data: { onChainStatus: 'confirmed' }
      });
    }

    return {
      isAuthentic,
      confidence,
      fileHash: dbFile.fileHash,
      originalFileSize: dbFile.fileSize.toString(),
      originalUploadDate: dbFile.uploadedAt.toISOString(),
      verificationDate: new Date().toISOString(),
      verificationId: onChainData.verificationId.toString(),
      blockchainProof: {
        owner: onChainData.owner.toString(),
        ipfsHash: onChainData.ipfsHash,
        contentType: onChainData.contentType,
        blockHeight: (await connection.getSlot('confirmed')) // Approximation
      },
      integrityChecks: {
        hashMatch,
        sizeMatch,
        ipfsHashMatch,
        contentTypeMatch
      }
    };
  }
}
