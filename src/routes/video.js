import express from 'express';

import authMiddleware from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';
import { 
    uploadVideo,
    trimVideoController,
    mergeVideosController,
    createSharedLink,
    accessSharedLink
} from '../controllers/videoController.js';

const router = express.Router();

router.post('/upload', authMiddleware, upload.single('video'), uploadVideo);
router.post('/trim', authMiddleware, trimVideoController);
router.post('/merge', authMiddleware, mergeVideosController);

router.post('/share', authMiddleware, createSharedLink);
router.get('/shared/:unique_link_id', accessSharedLink);

export default router;