import { Router } from 'express';
import * as verifyController from './verify.controller.js';
import { authenticate } from '../../middleware/auth.js';
import multer from 'multer';
import os from 'os';

const router = Router();
const upload = multer({ dest: os.tmpdir() });

// Verify by file ID
router.get('/:id', authenticate, verifyController.verifyFile);

// Verify by uploading the file again (matches FileContext.tsx implementation)
router.post('/', authenticate, upload.single('file'), verifyController.verifyFileMultipart);

export default router;
