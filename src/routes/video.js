import express from 'express';

import authMiddleware from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { 
    uploadVideo,
    trimVideoController
} from '../controllers/videoController.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('video'), uploadVideo);
router.post('/trim', authMiddleware, trimVideoController);

export default router;