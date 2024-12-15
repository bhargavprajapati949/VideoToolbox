import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { promisify } from 'util';

import config from '../../config.js';
import { Video, SharedLink } from '../models/index.js';
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
const maxLinkShareTime = config.get('video.maxLinkShareTime');

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

export const createSharedLink = async (req, res, next) => {
  try {
    const { video_id, expiry_duration } = req.body;

    if (!video_id) {
      throw new APIError('video_id is required.', 400);
    }

    const video = await Video.findByPk(video_id);
    if (!video) {
      throw new APIError('Video with the given ID does not exist.', 404);
    }

    const expiryDuration = expiry_duration || maxLinkShareTime;
    if (expiryDuration > maxLinkShareTime) {
      throw new APIError(`Expiry time cannot exceed ${maxLinkShareTime} seconds.`, 400);
    }

    const expiryTime = new Date(Date.now() + expiryDuration * 1000);

    let uniqueLinkId;
    let isUnique = false;
    while (!isUnique) {
      uniqueLinkId = uuidv4();
      const existingLink = await SharedLink.findOne({ where: { unique_link_id: uniqueLinkId } });
      isUnique = !existingLink;
    }

    const sharedLink = await SharedLink.create({
      video_id,
      unique_link_id: uniqueLinkId,
      expiry_time: expiryTime,
    });

    res.status(201).json({
      message: 'Shared link created successfully.',
      link: `${req.protocol}://${req.get('host')}/api/v1.0/video/shared/${uniqueLinkId}`,
      expiry_time: sharedLink.expiry_time,
    });
  } catch (error) {
    next(error);
  }
};

export const accessSharedLink = async (req, res, next) => {
  try {
    const { unique_link_id } = req.params;

    const sharedLink = await SharedLink.findOne({ where: { unique_link_id } });
    if (!sharedLink) {
      throw new APIError('Invalid or expired link.', 404);
    }

    if (new Date() > sharedLink.expiry_time) {
      throw new APIError('This link has expired.', 403);
    }

    const video = await Video.findByPk(sharedLink.video_id);
    if (!video) {
      throw new APIError('Video not found.', 404);
    }

    const filePath = path.resolve(video.file_path);

    const action = req.query.action; // `stream` or `download`
    if (action === 'download') {
      res.download(filePath, path.basename(filePath));
    } else {
      const stat = fs.statSync(filePath);
      res.writeHead(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': stat.size,
      });
      const readStream = fs.createReadStream(filePath);
      readStream.pipe(res);
    }
  } catch (error) {
    next(error);
  }
};