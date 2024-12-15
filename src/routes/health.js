import express from 'express';

import { sequelize } from '../models/db.js';
import logger from '../utils/logger.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        await sequelize.authenticate();
        logger.info('Health check passed!');
        res.send('Video Toolbox is running!');
    } catch (error) {
        logger.error('Health check failed:', error);
        res.status(500).send('Video Toolbox is down!')
    }
})

export default router;