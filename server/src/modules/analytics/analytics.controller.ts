import type { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from './analytics.service.js';
import type { AuthenticatedRequest } from '../../types/index.js';

export const getStorageAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const data = await AnalyticsService.getStorageAnalytics(authReq.user.walletAddress);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  try {
    const data = await AnalyticsService.getDashboardAnalytics(authReq.user.walletAddress);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
};
