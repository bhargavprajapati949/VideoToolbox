import express from 'express';

import HealthRouter from './routes/health.js';

const app = express();

app.use('/_health', HealthRouter);

export default app;