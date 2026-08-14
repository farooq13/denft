import type { Request, Response } from 'express';
import { VerifyService } from './verify.service.js';
import { createModuleLogger } from '../../lib/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

const log = createModuleLogger('verify-controller');

export const verifyFile = async (req: Request, res: Response) => {
  try {
    // The frontend passes fileId in the body for POST, or we could accept it from params or query
    let fileId: string | undefined;

    if (req.method === 'POST') {
      // Look for it in body. Note: frontend might be sending FormData if it uploads a file to verify.
      // In the context of FileContext.tsx, it sends:
      // formData.append('file', file);
      // formData.append('ownerAddress', ownerAddress);
      
      // If it's a multipart form, we might need to extract the ID differently, or we can look up by fileHash.
      // Let's assume the frontend will pass fileId if we adjust the frontend, or we lookup by something else.
      // Wait, in FileContext.tsx it says `fetch('/api/verify/file', { method: 'POST', body: formData })`.
      // It uploads the file again! This means we need to handle multer here and compute the hash.
      
      res.status(400).json({
        success: false,
        error: 'Please use GET /api/verify/file/:id to verify an existing file, or update the frontend to pass fileId.'
      });
      return;
    } else {
      fileId = req.params.id as string;
    }

    if (!fileId) {
      res.status(400).json({ success: false, error: 'File ID is required' });
      return;
    }

    const verificationResult = await VerifyService.verifyFile(fileId);

    res.json({
      success: true,
      verification: verificationResult
    });
  } catch (error: any) {
    log.error({ err: error }, 'Verification failed');
    
    if (error.message === 'FILE_NOT_FOUND') {
      res.status(404).json({ success: false, error: 'File not found in database' });
      return;
    }
    
    res.status(500).json({
      success: false,
      error: error.message || 'An error occurred during verification'
    });
  }
};

export const verifyFileMultipart = async (req: Request, res: Response) => {
  // If the frontend uploads the file again to verify it
  try {
    if (!req.file) {
      res.status(400).json({ success: false, error: 'No file uploaded for verification' });
      return;
    }

    // The frontend passed the file. We need to compute its hash and find it in the DB.
    import('crypto').then(async (crypto) => {
      import('fs/promises').then(async (fsPromises) => {
        const fileBuffer = await fsPromises.readFile(req.file!.path);
        const fileHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');
        
        import('../../lib/prisma.js').then(async (prismaModule) => {
          const { prisma } = prismaModule;
          // Find file by hash
          const dbFile = await prisma.file.findFirst({
            where: { fileHash },
            orderBy: { uploadedAt: 'desc' }
          });

          if (!dbFile) {
            res.status(404).json({
              success: false,
              error: 'File does not exist in the database. Cannot verify on-chain.'
            });
            return;
          }

          const verificationResult = await VerifyService.verifyFile(dbFile.id);
          
          res.json({
            success: true,
            verification: verificationResult
          });
        });
      });
    });

  } catch (error: any) {
    log.error({ err: error }, 'Multipart verification failed');
    res.status(500).json({ success: false, error: 'Verification failed' });
  }
};
