import { Video } from '../models/index.js';
import APIError from '../utils/APIError.js';
import {
  getVideoMetadata,
  validateVideoDuration,
  deleteVideoFile,
} from '../utils/videoProcessor.js';

export const uploadVideo = async (req, res, next) => {
  try {
    if (!req.file) {
      throw new APIError('No file uploaded.', 400);
    }

    const { file } = req;
    const filePath = file.path;

    try {
      // Extract video metadata
      const metadata = await getVideoMetadata(filePath);

      // Validate duration
      const { duration } = metadata.format;
      validateVideoDuration(duration);

      // Save video metadata to the database
      const video = await Video.create({
        user_id: req.user.user_id,
        file_path: filePath,
        size: file.size,
        duration,
      });

      res.status(201).json({
        message: 'Video uploaded successfully.',
        video: {
          id: video.video_id,
          size: video.size,
          duration,
        },
      });
    } catch (error) {
      // Delete the file in case of any validation or processing error
      deleteVideoFile(filePath);
      throw error;
    }
  } catch (error) {
    next(error);
  }
};