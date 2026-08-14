import { prisma } from '../../lib/prisma.js';
import { redis } from '../../lib/redis.js';
import { createModuleLogger } from '../../lib/logger.js';

const log = createModuleLogger('analytics-service');
const CACHE_TTL = 300; // 5 minutes cache

export class AnalyticsService {
  /**
   * Fetches storage limits and groups storage usage by file category.
   */
  static async getStorageAnalytics(walletAddress: string) {
    const cacheKey = `analytics:storage:${walletAddress}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const user = await prisma.user.findUnique({
      where: { walletAddress },
      select: { storageUsed: true, storageLimit: true },
    });

    if (!user) throw new Error('USER_NOT_FOUND');

    const files = await prisma.file.groupBy({
      by: ['category'],
      where: { ownerWallet: walletAddress, isActive: true },
      _sum: { fileSize: true },
    });

    const storageBreakdown = files.map((f) => ({
      name: f.category.charAt(0).toUpperCase() + f.category.slice(1),
      value: Number(f._sum.fileSize || 0),
    }));

    const result = {
      usedStorage: Number(user.storageUsed),
      totalStorage: Number(user.storageLimit),
      storageBreakdown,
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  }

  /**
   * Fetches overall aggregated stats and builds a 7-day history.
   * Note: Without a time-series table for views/downloads, we assign 
   * a file's views/downloads to its upload date for the history chart.
   */
  static async getDashboardAnalytics(walletAddress: string) {
    const cacheKey = `analytics:dashboard:${walletAddress}`;
    const cached = await redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const activeFiles = await prisma.file.findMany({
      where: { ownerWallet: walletAddress, isActive: true },
      select: {
        accessCount: true,
        downloadCount: true,
        uploadedAt: true,
        isPublic: true,
      },
    });

    let totalViews = 0;
    let totalDownloads = 0;
    let filesShared = 0;
    const totalFiles = activeFiles.length;

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const historyMap: Record<string, { date: string; uploads: number; downloads: number; views: number }> = {};
    for (let i = 0; i < 7; i++) {
      const d = new Date(sevenDaysAgo);
      d.setDate(d.getDate() + i);
      const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      historyMap[dateStr] = { date: dateStr, uploads: 0, downloads: 0, views: 0 };
    }

    for (const file of activeFiles) {
      totalViews += file.accessCount;
      totalDownloads += file.downloadCount;
      if (file.isPublic) filesShared += 1;

      const fileDate = new Date(file.uploadedAt);
      if (fileDate >= sevenDaysAgo) {
        const dateStr = fileDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        if (historyMap[dateStr]) {
          historyMap[dateStr].uploads += 1;
          historyMap[dateStr].views += file.accessCount;
          historyMap[dateStr].downloads += file.downloadCount;
        }
      }
    }

    const result = {
      totalFiles,
      totalDownloads,
      totalViews,
      filesShared,
      history: Object.values(historyMap),
    };

    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    return result;
  }
}
