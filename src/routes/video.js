import express from 'express';

import authMiddleware from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { uploadVideo } from '../controllers/videoController.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('video'), uploadVideo);

export default router;