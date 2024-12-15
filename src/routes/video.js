import express from 'express';

import authMiddleware from '../middlewares/auth.js';

const router = express.Router();

router.get('/test', authMiddleware, (req, res) => {
    res.send(`${JSON.stringify(req.user)}`);
});

export default router;