import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { promisify } from 'util';

import config from '../../config.js';
import APIError from '../utils/APIError.js';

const unlinkAsync = promisify(fs.unlink);

export const getVideoMetadata = (filePath) => {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new APIError('Failed to process video file.', 400));
      } else {
        resolve(metadata);
      }
    });
  });
};

export const validateVideoDuration = (duration) => {
  const minDuration = config.get('video.minDuration');
  const maxDuration = config.get('video.maxDuration');

  if (duration < minDuration || duration > maxDuration) {
    throw new APIError(
      `Video duration must be between ${minDuration} and ${maxDuration} seconds.`,
      400
    );
  }
};

export const deleteVideoFile = async (filePath) => {
  try {
    await unlinkAsync(filePath);
  } catch (err) {
    console.error(`Failed to delete file: ${filePath}, Error: ${err.message}`);
  }
};