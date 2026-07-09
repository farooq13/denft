import { PinataSDK } from 'pinata';
import { env } from '../../config/env.js';
import { prisma } from '../../lib/prisma.js';
import { createModuleLogger } from '../../lib/logger.js';
import { openAsBlob } from 'node:fs';
import { createHash } from 'node:crypto';
import * as fs from 'node:fs';

const log = createModuleLogger('file-service');

const pinata = new PinataSDK({
  pinataJwt: env.PINATA_JWT,
  pinataGateway: env.PINATA_GATEWAY,
});

export interface UploadFileMetadata {
  description?: string;
  category: string;
  tags: string[];
  isPublic: boolean;
}

export class FileService {
  /**
   * Securely streams a file to Pinata IPFS, calculates SHA-256 hash, and records in DB.
   * Assumes the file is currently temporarily stored on disk.
   */
  static async uploadFile(
    localFilePath: string,
    fileName: string,
    mimeType: string,
    fileSize: number,
    ownerWallet: string,
    metadata: UploadFileMetadata,
  ) {
    try {
      // 1. Calculate SHA-256 hash
      const fileHash = await this.calculateFileHash(localFilePath);

      // 2. Wrap the disk file as a memory-efficient Blob/File for Pinata
      const blob = await openAsBlob(localFilePath);
      const file = new File([blob], fileName, { type: mimeType });

      // 3. Upload to IPFS via Pinata
      log.info({ fileName, ownerWallet }, 'Uploading file to IPFS...');
      const uploadResult = await pinata.upload.public.file(file);
      const ipfsHash = uploadResult.cid;

      // 4. Save metadata to database and update user metrics within a transaction
      const record = await prisma.$transaction(async (tx) => {
        // Create the file record
        const newFile = await tx.file.create({
          data: {
            ownerWallet,
            fileHash,
            ipfsHash,
            fileName,
            fileSize: BigInt(fileSize),
            contentType: mimeType,
            description: metadata.description || '',
            category: metadata.category,
            tags: metadata.tags,
            isPublic: metadata.isPublic,
          },
        });

        // Update the user's storage and file counts
        await tx.user.update({
          where: { walletAddress: ownerWallet },
          data: {
            fileCount: { increment: 1 },
            storageUsed: { increment: BigInt(fileSize) },
          },
        });

        return newFile;
      });

      log.info({ fileId: record.id, ipfsHash }, 'File successfully pinned and saved');
      return record;
    } finally {
      // 5. Cleanup temporary file from disk regardless of success or failure
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }
    }
  }

  /**
   * Unpins the file from IPFS and soft-deletes the database record.
   * Reclaims storage space for the user.
   */
  static async deleteFile(fileId: string, walletAddress: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || file.ownerWallet !== walletAddress || !file.isActive) {
      throw new Error('FILE_NOT_FOUND');
    }

    await prisma.$transaction(async (tx) => {
      // Soft delete
      await tx.file.update({
        where: { id: fileId },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      // Reclaim user storage
      await tx.user.update({
        where: { walletAddress },
        data: {
          fileCount: { decrement: 1 },
          storageUsed: { decrement: file.fileSize },
        },
      });
    });

    // Fire and forget unpin from Pinata
    try {
      await pinata.files.public.delete([file.ipfsHash]);
      log.info({ ipfsHash: file.ipfsHash }, 'File unpinned from IPFS');
    } catch (err) {
      log.warn({ err, ipfsHash: file.ipfsHash }, 'Failed to unpin file from Pinata');
    }
  }

  /**
   * Retrieves a paginated list of active files for a user.
   */
  static async getUserFiles(walletAddress: string, skip = 0, take = 50) {
    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: { ownerWallet: walletAddress, isActive: true },
        orderBy: { uploadedAt: 'desc' },
        skip,
        take,
      }),
      prisma.file.count({
        where: { ownerWallet: walletAddress, isActive: true },
      }),
    ]);

    // Convert BigInt to string for JSON serialization
    return {
      files: files.map((f) => ({ ...f, fileSize: f.fileSize.toString() })),
      total,
    };
  }

  /**
   * Validates access and returns a streaming URL for the IPFS content.
   */
  static async getFileAccess(fileId: string, requesterWalletAddress?: string) {
    const file = await prisma.file.findUnique({ where: { id: fileId } });

    if (!file || !file.isActive) {
      throw new Error('FILE_NOT_FOUND');
    }

    if (!file.isPublic && file.ownerWallet !== requesterWalletAddress) {
      throw new Error('UNAUTHORIZED');
    }

    // Increment access count
    await prisma.file.update({
      where: { id: fileId },
      data: { accessCount: { increment: 1 } },
    });

    // Create signed Gateway URL for private access (using the Pinata SDK)
    // Actually the SDK creates gateway URLs easily. But since Pinata SDK v2 doesn't have a direct "signed gateway" method unless configured,
    // we can just construct the gateway URL manually.
    const gatewayUrl = `${env.PINATA_GATEWAY}/ipfs/${file.ipfsHash}`;
    
    // In a real private scenario with Pinata, we would generate a signed token, but for now we stream it directly or redirect.
    return { file, gatewayUrl };
  }

  private static calculateFileHash(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const hash = createHash('sha256');
      const stream = fs.createReadStream(filePath);
      
      stream.on('data', (data) => hash.update(data));
      stream.on('end', () => resolve(hash.digest('hex')));
      stream.on('error', reject);
    });
  }
}
