import { Router } from 'express';
import multer from 'multer';
import * as os from 'node:os';
import { uploadFile, getMyFiles, deleteFile, streamFile } from './file.controller.js';
import { authenticate } from '../../middleware/auth.js';

const router = Router();

// Configure multer for temporary disk storage
const upload = multer({
  dest: os.tmpdir(), // temporary directory
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for example
});

// Protected routes
router.post('/upload', authenticate, upload.single('file'), uploadFile);
router.get('/my-files', authenticate, getMyFiles); // frontend expects /my-files instead of /
router.delete('/:id', authenticate, deleteFile);

// Shared/Public file endpoints (stubs for Sprint 2, logic to be fleshed out later)
router.get('/shared-with-me', authenticate, (req, res) => res.json({ success: true, files: [] }));
router.get('/public', (req, res) => res.json({ success: true, files: [] }));

// Mixed-access routes
router.get('/:id/stream', streamFile);

export default router;
