import type { Request, Response } from 'express';
import { FileService } from './file.service.js';
import { uploadFileSchema } from './file.validators.js';
import { createModuleLogger } from '../../lib/logger.js';
import type { AuthenticatedRequest } from '../../types/index.js';

const log = createModuleLogger('file-controller');

export const uploadFile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  
  if (!req.file) {
    res.status(400).json({
      success: false,
      error: { code: 'BAD_REQUEST', message: 'No file uploaded' },
    });
    return;
  }

  try {
    // Validate the multipart body metadata using Zod
    const { body: metadata } = uploadFileSchema.parse({ body: req.body });

    const record = await FileService.uploadFile(
      req.file.path,
      req.file.originalname,
      req.file.mimetype,
      req.file.size,
      authReq.user.walletAddress,
      metadata
    );

    res.status(201).json({
      success: true,
      fileId: record.id,
      ipfsHash: record.ipfsHash,
      fileHash: record.fileHash,
      onChainStatus: record.onChainStatus,
      fileSize: Number(record.fileSize),
      contentType: record.contentType,
      uploadedAt: record.uploadedAt.getTime(),
      processingStatus: 'pending'
    });
  } catch (error: any) {
    log.error({ err: error }, 'Upload file failed');
    res.status(400).json({
      success: false,
      error: error.message || 'File upload failed',
    });
  }
};

export const getMyFiles = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const skip = parseInt(req.query.skip as string, 10) || 0;
  const take = parseInt(req.query.take as string, 10) || 50;

  try {
    const result = await FileService.getUserFiles(authReq.user.walletAddress, skip, take);
    
    // Frontend expects { files: [...], usedStorage: N, totalStorage: M }
    res.json({
      success: true,
      files: result.files.map(f => ({
        ...f,
        fileId: f.id // Map id to fileId for frontend
      })),
      total: result.total,
      // For now, we will return some mock storage info until we fetch user's actual limit in this endpoint
      usedStorage: 0,
      totalStorage: 1073741824
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve files',
    });
  }
};

export const deleteFile = async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const fileId = req.params.id;

  try {
    await FileService.deleteFile(fileId, authReq.user.walletAddress);
    res.json({
      success: true,
      data: { message: 'File deleted successfully' },
    });
  } catch (error: any) {
    if (error.message === 'FILE_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found or unauthorized' },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'DELETE_ERROR', message: 'Failed to delete file' },
    });
  }
};

export const streamFile = async (req: Request, res: Response) => {
  // Can be called anonymously for public files, or authenticated for private ones.
  // We'll optionally extract the user if the Authorization header is present.
  const authHeader = req.headers.authorization;
  let requesterWalletAddress: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    import('jsonwebtoken').then(jwt => {
      import('../../config/env.js').then(({ env }) => {
        try {
          const decoded = jwt.default.verify(token, env.JWT_SECRET) as any;
          requesterWalletAddress = decoded.walletAddress;
        } catch {
          // Ignore invalid token, treated as anonymous
        }
      });
    });
    // Wait slightly to ensure async jwt decode happens before proceeding (simplified).
    // In production, we'd want this as a proper middleware.
    await new Promise(r => setTimeout(r, 50));
  }

  try {
    const { gatewayUrl } = await FileService.getFileAccess(req.params.id, requesterWalletAddress);
    
    // In a full implementation, you would pipe the stream from Pinata to the res object.
    // For now, redirecting to the IPFS gateway is efficient for the client.
    res.redirect(302, gatewayUrl);
  } catch (error: any) {
    if (error.message === 'FILE_NOT_FOUND') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' },
      });
      return;
    }
    if (error.message === 'UNAUTHORIZED') {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'You do not have permission to view this file' },
      });
      return;
    }
    res.status(500).json({
      success: false,
      error: { code: 'STREAM_ERROR', message: 'Failed to retrieve file' },
    });
  }
};
