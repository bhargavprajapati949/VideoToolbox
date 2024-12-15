import { v4 as uuidv4 } from 'uuid';


import {
  uploadVideo,
  trimVideoController,
  mergeVideosController,
  createSharedLink,
  accessSharedLink,
} from '../../../src/controllers/videoController.js';

import { Video, SharedLink } from '../../../src/models/index.js';
import {
  getVideoMetadata,
  validateVideoDuration,
  validateTrimTimes,
  trimVideo,
  mergeVideos,
  deleteVideoFile,
} from '../../../src/utils/videoProcessor.js';

import APIError from '../../../src/utils/APIError.js';

jest.mock('../../../src/models/index.js', () => ({
  Video: {
    create: jest.fn(),
    findByPk: jest.fn(),
    findAll: jest.fn(),
  },
  SharedLink: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('../../../src/utils/videoProcessor.js', () => ({
  getVideoMetadata: jest.fn(),
  validateVideoDuration: jest.fn(),
  validateTrimTimes: jest.fn(),
  trimVideo: jest.fn(),
  mergeVideos: jest.fn(),
  deleteVideoFile: jest.fn(),
}));

jest.mock('fs', () => ({
  stat: jest.fn((file, cb) => cb(null, { size: 1234 })),
  statSync: jest.fn(() => ({ size: 1000 })),
  createReadStream: jest.fn(() => ({ pipe: jest.fn() })),
}));

jest.mock('path', () => ({
  ...jest.requireActual('path'),
  resolve: jest.fn((...args) => args.join('/')),
  basename: jest.fn((f) => 'video.mp4'),
}));

jest.mock('uuid', () => ({
  v4: jest.fn(),
}));

// Mock config
jest.mock('../../../config.js', () => ({
  get: jest.fn((key) => {
    if (key === 'video.uploadDirectory') return '/uploads';
    if (key === 'video.maxLinkShareTime') return 86400;
    if (key === 'video.minDuration') return 10;
    if (key === 'video.maxDuration') return 300;
    return null;
  }),
}));

describe('videoController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { user: { user_id: 1 }, body: {}, file: {}, params: {}, query: {}, protocol: 'http', get: jest.fn(() => 'localhost:3000') };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      download: jest.fn(),
      writeHead: jest.fn(),
      end: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('uploadVideo', () => {
    it('should throw 400 if no file is uploaded', async () => {
      req.file = null;

      await uploadVideo(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(APIError);
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe('No file uploaded.');
    });

    it('should delete file and throw error if getVideoMetadata fails', async () => {
      req.file = { path: '/path/to/video.mp4', size: 1000 };
      getVideoMetadata.mockRejectedValue(new APIError('Failed to process video file.', 400));

      await uploadVideo(req, res, next);

      expect(deleteVideoFile).toHaveBeenCalledWith('/path/to/video.mp4');
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Failed to process video file.');
    });

    it('should delete file and throw error if duration validation fails', async () => {
      req.file = { path: '/path/to/video.mp4', size: 1000 };
      getVideoMetadata.mockResolvedValue({ format: { duration: 120 } });
      validateVideoDuration.mockImplementation(() => { throw new APIError('Invalid duration', 400); });

      await uploadVideo(req, res, next);

      expect(deleteVideoFile).toHaveBeenCalledWith('/path/to/video.mp4');
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid duration');
    });

    it('should create video and return 201 on success', async () => {
      req.file = { path: '/path/to/video.mp4', size: 1000 };
      getVideoMetadata.mockResolvedValue({ format: { duration: 120 } });
      validateVideoDuration.mockReturnValue(undefined);
      Video.create.mockResolvedValue({ video_id: 99, size: 1000, duration: 120 });

      await uploadVideo(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Video uploaded successfully.',
        video: { id: 99, size: 1000, duration: 120 },
      });
    });
  });

  describe('trimVideoController', () => {
    it('should throw 400 if required fields are missing', async () => {
      req.body = {};
      await trimVideoController(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Missing required fields: video_id, start_time, or end_time.');
      expect(error.statusCode).toBe(400);
    });

    it('should throw 404 if video not found', async () => {
      req.body = { video_id: 10, start_time: 0, end_time: 10 };
      Video.findByPk.mockResolvedValue(null);

      await trimVideoController(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Video with the given ID does not exist.');
      expect(error.statusCode).toBe(404);
    });

    it('should throw error if trim times are invalid', async () => {
      req.body = { video_id: 10, start_time: 0, end_time: 200 };
      Video.findByPk.mockResolvedValue({ video_id: 10, duration: 100, file_path: '/videos/original.mp4' });
      validateTrimTimes.mockImplementation(() => { throw new APIError('Invalid start_time or end_time', 400); });

      await trimVideoController(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid start_time or end_time');
    });

    it('should trim the video and create a new record', async () => {
      req.body = { video_id: 10, start_time: 0, end_time: 10 };
      Video.findByPk.mockResolvedValue({ video_id: 10, duration: 100, file_path: '/videos/original.mp4' });
      validateTrimTimes.mockReturnValue(undefined);
      trimVideo.mockResolvedValue(undefined);
      Video.create.mockResolvedValue({ video_id: 101, size: 1234, duration: 10 });

      await trimVideoController(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Video trimmed successfully.',
        video: { id: 101, size: 1234, duration: 10 },
      });
    });
  });

  describe('mergeVideosController', () => {
    it('should throw 400 if video_ids is not a non-empty array', async () => {
      req.body.video_ids = [];
      await mergeVideosController(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('video_ids must be a non-empty array.');
    });

    it('should throw 404 if some video_ids are invalid', async () => {
      req.body.video_ids = [1, 2];
      Video.findAll.mockResolvedValue([{ video_id: 1 }]);

      await mergeVideosController(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Some video_ids are invalid or do not exist.');
      expect(error.statusCode).toBe(404);
    });

    it('should merge videos and respond with success', async () => {
      req.body.video_ids = [1, 2];
      Video.findAll.mockResolvedValue([
        { video_id: 1, file_path: '/path/video1.mp4', duration: 50 },
        { video_id: 2, file_path: '/path/video2.mp4', duration: 100 },
      ]);
      mergeVideos.mockResolvedValue(undefined);
      Video.create.mockResolvedValue({ video_id: 99, size: 999, duration: 150 });

      await mergeVideosController(req, res, next);

      expect(mergeVideos).toHaveBeenCalledWith(['/path/video1.mp4', '/path/video2.mp4'], expect.stringContaining('merged_'));
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Video merged successfully.',
        video: { id: 99, size: 999, duration: 150 },
      });
    });

    it('should handle errors from mergeVideos', async () => {
      req.body.video_ids = [1];
      Video.findAll.mockResolvedValue([{ video_id: 1, file_path: '/path/video1.mp4', duration: 50 }]);
      mergeVideos.mockRejectedValue(new APIError('Failed to merge', 500));

      await mergeVideosController(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Failed to merge');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('createSharedLink', () => {
    it('should throw 400 if video_id is missing', async () => {
      await createSharedLink(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('video_id is required.');
    });

    it('should throw 404 if video not found', async () => {
      req.body.video_id = 10;
      Video.findByPk.mockResolvedValue(null);
      await createSharedLink(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Video with the given ID does not exist.');
    });

    it('should throw 400 if expiry_duration > maxLinkShareTime', async () => {
      req.body = { video_id: 10, expiry_duration: 999999 };
      Video.findByPk.mockResolvedValue({ video_id: 10 });
      await createSharedLink(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toContain('Expiry time cannot exceed');
      expect(error.statusCode).toBe(400);
    });

    it('should create a shared link successfully', async () => {
      req.body = { video_id: 10 };
      Video.findByPk.mockResolvedValue({ video_id: 10 });
      uuidv4.mockReturnValueOnce('unique-id');
      SharedLink.findOne.mockResolvedValue(null);
      SharedLink.create.mockResolvedValue({ expiry_time: new Date() });

      await createSharedLink(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        message: 'Shared link created successfully.',
        link: expect.stringContaining('http://localhost:3000/api/v1.0/video/shared/unique-id')
      }));
    });
  });

  describe('accessSharedLink', () => {
    it('should throw 404 if shared link does not exist', async () => {
      req.params.unique_link_id = 'nonexistent';
      SharedLink.findOne.mockResolvedValue(null);

      await accessSharedLink(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid or expired link.');
      expect(error.statusCode).toBe(404);
    });

    it('should throw 403 if link is expired', async () => {
      req.params.unique_link_id = 'link123';
      SharedLink.findOne.mockResolvedValue({ expiry_time: new Date(Date.now() - 1000) });

      await accessSharedLink(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('This link has expired.');
      expect(error.statusCode).toBe(403);
    });

    it('should throw 404 if video not found', async () => {
      req.params.unique_link_id = 'link123';
      SharedLink.findOne.mockResolvedValue({ expiry_time: new Date(Date.now() + 10000), video_id: 99 });
      Video.findByPk.mockResolvedValue(null);

      await accessSharedLink(req, res, next);
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Video not found.');
      expect(error.statusCode).toBe(404);
    });

    it('should download the video if action=download', async () => {
      req.params.unique_link_id = 'link123';
      req.query.action = 'download';
      SharedLink.findOne.mockResolvedValue({ expiry_time: new Date(Date.now() + 10000), video_id: 50 });
      Video.findByPk.mockResolvedValue({ file_path: '/path/to/video.mp4' });

      await accessSharedLink(req, res, next);

      expect(res.download).toHaveBeenCalledWith('/path/to/video.mp4', 'video.mp4');
    });

    it('should stream the video if no action specified', async () => {
      req.params.unique_link_id = 'link123';
      SharedLink.findOne.mockResolvedValue({ expiry_time: new Date(Date.now() + 10000), video_id: 50 });
      Video.findByPk.mockResolvedValue({ file_path: '/path/to/video.mp4' });

      await accessSharedLink(req, res, next);

      expect(res.writeHead).toHaveBeenCalledWith(200, {
        'Content-Type': 'video/mp4',
        'Content-Length': 1000,
      });
    });
  });
});