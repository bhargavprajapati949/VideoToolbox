import app from './src/app.js';
import config from './config.js';
import { initDb } from './src/models/db.js';
import { checkFFmpegAvailability } from './src/utils/checkFFmpeg.js';
import logger from './src/utils/logger.js';

const PORT = config.get('port')

await checkFFmpegAvailability();

await initDb();

app.listen(PORT, () => {
    logger.info(`Video Toolbox is running on port ${PORT}`);
})