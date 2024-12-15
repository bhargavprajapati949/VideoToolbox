import express from 'express';
import { sequelize } from '../models/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        await sequelize.authenticate();
        res.send('Video Toolbox is running!');
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(500).send('Video Toolbox is down!')
    }
})

export default router;