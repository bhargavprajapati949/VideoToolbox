import { exec } from 'child_process';
import logger from './logger.js';

export const checkFFmpegAvailability = () => {
  return new Promise((resolve, reject) => {
    exec('ffmpeg -version', (error) => {
      if (error) {
        reject(new Error(
          `FFmpeg is not installed or not available in the system PATH.\n` +
          `Please install FFmpeg and ensure it is accessible via the PATH.\n` +
          `Refer to the official installation guide: https://www.ffmpeg.org/download.html`
        ));
      } else {
        logger.info(`FFmpeg is available in the system.`);
        resolve();
      }
    });
  });
};