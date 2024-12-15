import express from 'express';
import bodyParser from 'body-parser';

import HealthRouter from './routes/health.js';
import UserRouter from './routes/user.js';
import VideoRouter from './routes/video.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/_health', HealthRouter);

app.use('/api/v1.0/user', UserRouter);
app.use('/api/v1.0/video', VideoRouter);

app.use(errorHandler)

export default app;