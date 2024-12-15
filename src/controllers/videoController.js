import path from 'path';
import fs from 'fs';
import { promisify } from 'util';

import config from '../../config.js';
import { Video } from '../models/index.js';
import APIError from '../utils/APIError.js';
import {
  getVideoMetadata,
  trimVideo,
  mergeVideos,
  validateVideoDuration,
  validateTrimTimes,
  deleteVideoFile,
} from '../utils/videoProcessor.js';

const statAsync = promisify(fs.stat);
const uploadDirectory = config.get('video.uploadDirectory');

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

export const trimVideoController = async (req, res, next) => {
  try {
    const { video_id, start_time, end_time } = req.body;

    // Validate inputs
    if (!video_id || start_time == null || end_time == null) {
      throw new APIError('Missing required fields: video_id, start_time, or end_time.', 400);
    }

    // Fetch the video from the database
    const video = await Video.findByPk(video_id);
    if (!video) {
      throw new APIError('Video with the given ID does not exist.', 404);
    }

    // Validate start_time and end_time
    validateTrimTimes(start_time, end_time, video.duration);

    // Generate output file path
    // const outputFileName = `trimmed_${Date.now()}_${path.basename(video.file_path)}`;
    const outputFileName = `trimmed_${path.basename(video.file_path)}`;
    const outputFilePath = path.resolve(uploadDirectory, outputFileName);

    // Perform video trimming
    await trimVideo(video.file_path, outputFilePath, start_time, end_time);

    // Get size of the trimmed video
    const trimmedVideoStats = await statAsync(outputFilePath);

    // Save the new video in the database
    const trimmedVideo = await Video.create({
      user_id: req.user.user_id,
      file_path: outputFilePath,
      size: trimmedVideoStats.size,
      duration: end_time - start_time,
    });

    // Respond with success
    res.status(201).json({
      message: 'Video trimmed successfully.',
      video: {
        id: trimmedVideo.video_id,
        size: trimmedVideo.size,
        duration: trimmedVideo.duration,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const mergeVideosController = async (req, res, next) => {
  try {
    const { video_ids } = req.body;

    if (!Array.isArray(video_ids) || video_ids.length === 0) {
      throw new APIError('video_ids must be a non-empty array.', 400);
    }

    const videos = await Video.findAll({
      where: { video_id: video_ids },
    });

    if (videos.length !== video_ids.length) {
      throw new APIError('Some video_ids are invalid or do not exist.', 404);
    }

    const inputPaths = videos.map((video) => video.file_path);
    const totalDuration = videos.reduce((sum, video) => sum + video.duration, 0);

    const outputFileName = `merged_${req.user.user_id}_${Date.now()}.mp4`;
    const outputFilePath = path.resolve(uploadDirectory, outputFileName);

    await mergeVideos(inputPaths, outputFilePath);

    const mergedVideoStats = await statAsync(outputFilePath);

    const mergedVideo = await Video.create({
      user_id: req.user.user_id,
      file_path: outputFilePath,
      size: mergedVideoStats.size,
      duration: totalDuration,
    });

    res.status(201).json({
      message: 'Video merged successfully.',
      video: {
        id: mergedVideo.video_id,
        size: mergedVideo.size,
        duration: mergedVideo.duration,
      },
    });
  } catch (error) {
    next(error);
  }
};