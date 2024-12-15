import { createLogger, format, transports } from 'winston';
import config from '../../config.js';

const logger = createLogger({
    level: config.get('logLevel'),
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.printf(({ timestamp, level, message }) => `${timestamp} [${level.toUpperCase()}]: ${message}`)
    ),
    transports: [
        new transports.Console()
    ],
});

export default logger;