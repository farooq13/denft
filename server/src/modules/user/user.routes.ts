import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { getUserSettings, updateSettings, updatePasscode, verifyPasscode, wipeVault } from './user.controller.js';

const router = Router();

// Protect all user routes
router.use(authenticate);

router.get('/settings', getUserSettings);
router.patch('/settings', updateSettings);
router.post('/passcode', updatePasscode);
router.post('/verify-passcode', verifyPasscode);
router.post('/danger/wipe-vault', wipeVault);

export default router;
