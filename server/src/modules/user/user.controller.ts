import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma.js';
import bcrypt from 'bcrypt';

export const getUserSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user; // populated by authenticate middleware
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const userData = await prisma.user.findUnique({
      where: { walletAddress: user.walletAddress },
      select: { viewingPasscode: true, theme: true, viewMode: true, displayName: true, avatarUrl: true }
    });

    res.json({
      success: true,
      data: {
        hasPasscode: !!userData?.viewingPasscode,
        theme: userData?.theme || 'system',
        viewMode: userData?.viewMode || 'grid',
        displayName: userData?.displayName || null,
        avatarUrl: userData?.avatarUrl || null,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updatePasscode = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { passcode } = req.body;
    
    // Passcode can be empty to remove it, or a 3-6 digit string
    if (passcode !== undefined && passcode !== '') {
      if (!/^\d{3,6}$/.test(passcode)) {
        res.status(400).json({ success: false, error: 'Passcode must be a 3 to 6 digit number' });
        return;
      }
    }

    let hashedPasscode: string | null = null;
    if (passcode) {
      const saltRounds = 10;
      hashedPasscode = await bcrypt.hash(passcode, saltRounds);
    }

    await prisma.user.update({
      where: { walletAddress: user.walletAddress },
      data: { viewingPasscode: hashedPasscode }
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const verifyPasscode = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { passcode } = req.body;
    if (!passcode) {
      res.status(400).json({ success: false, error: 'Passcode is required' });
      return;
    }

    const userData = await prisma.user.findUnique({
      where: { walletAddress: user.walletAddress },
      select: { viewingPasscode: true }
    });

    if (!userData || !userData.viewingPasscode) {
      // If they don't have a passcode set, technically any verification should fail or succeed?
      // Since we force them to set it, if it's not set, they can't verify.
      res.status(400).json({ success: false, error: 'No passcode is set' });
      return;
    }

    const isValid = await bcrypt.compare(passcode, userData.viewingPasscode);
    
    if (isValid) {
      res.json({ success: true });
    } else {
      res.status(401).json({ success: false, error: 'Invalid passcode' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateSettings = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { theme, viewMode, displayName, avatarUrl } = req.body;

    const dataToUpdate: any = {};
    if (theme !== undefined) dataToUpdate.theme = theme;
    if (viewMode !== undefined) dataToUpdate.viewMode = viewMode;
    if (displayName !== undefined) dataToUpdate.displayName = displayName;
    if (avatarUrl !== undefined) dataToUpdate.avatarUrl = avatarUrl;

    const updatedUser = await prisma.user.update({
      where: { walletAddress: user.walletAddress },
      data: dataToUpdate,
      select: { theme: true, viewMode: true, displayName: true, avatarUrl: true }
    });

    res.json({
      success: true,
      data: updatedUser
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const wipeVault = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { signature, message } = req.body;
    if (!signature || !message) {
      res.status(400).json({ success: false, error: 'Signature and message are required' });
      return;
    }

    // Dynamic import to avoid changing top-level imports and risking breaking things
    const { verifySignature } = await import('../../lib/solana.js');

    const signatureBytes = new Uint8Array(signature);
    const isValid = verifySignature(message, signatureBytes, user.walletAddress);

    if (!isValid) {
      res.status(401).json({ success: false, error: 'Invalid signature' });
      return;
    }

    // Proceed with Wipe Vault
    await prisma.$transaction(async (tx) => {
      // Fetch full user to get their actual ID
      const fullUser = await tx.user.findUnique({
        where: { walletAddress: user.walletAddress },
        select: { id: true }
      });

      if (!fullUser) throw new Error('User not found');

      // Create Audit Log
      await tx.auditLog.create({
        data: {
          userId: fullUser.id,
          action: 'WIPE_VAULT',
          signature: Buffer.from(signatureBytes).toString('base64'),
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }
      });

      // Hard Delete all files for this user
      // Note: We don't unpin from Pinata here to avoid blocking the request for a long time if there are thousands of files. 
      // In a real scenario, we might queue this for a background worker.
      await tx.file.deleteMany({
        where: { ownerWallet: user.walletAddress }
      });

      // Reset User file count and storage
      await tx.user.update({
        where: { walletAddress: user.walletAddress },
        data: {
          fileCount: 0,
          storageUsed: BigInt(0)
        }
      });
    });

    res.json({ success: true, message: 'Vault wiped successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};
