import { Router } from 'express';
import { getStorageAnalytics, getDashboardAnalytics } from './analytics.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

router.get('/storage', authenticate, getStorageAnalytics);
router.get('/dashboard', authenticate, getDashboardAnalytics);

export default router;
