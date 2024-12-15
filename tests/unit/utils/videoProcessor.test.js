import ffmpeg from 'fluent-ffmpeg';
import fs from 'fs';
import { promisify } from 'util';
import {
  getVideoMetadata,
  trimVideo,
  mergeVideos,
  validateVideoDuration,
  validateTrimTimes,
  deleteVideoFile,
} from '../../../src/utils/videoProcessor.js';
import APIError from '../../../src/utils/APIError.js';

jest.mock('fluent-ffmpeg', () => {
  const mockCommand = {
    setStartTime: jest.fn().mockReturnThis(),
    setDuration: jest.fn().mockReturnThis(),
    output: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    run: jest.fn(),
    input: jest.fn().mockReturnThis(),
    mergeToFile: jest.fn().mockReturnThis(),
  };

  const mockedFfmpeg = jest.fn(() => mockCommand);
  mockedFfmpeg.ffprobe = jest.fn();

  return mockedFfmpeg;
});

jest.mock('fs', () => ({
  unlink: jest.fn((_, cb) => cb(null)),
}));

describe('videoProcessor', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getVideoMetadata', () => {
    it('should resolve with metadata when ffprobe succeeds', async () => {
      ffmpeg.ffprobe.mockImplementation((filePath, callback) => {
        callback(null, { format: { duration: 120 } });
      });

      const metadata = await getVideoMetadata('/path/to/video.mp4');
      expect(metadata.format.duration).toBe(120);
      expect(ffmpeg.ffprobe).toHaveBeenCalledWith('/path/to/video.mp4', expect.any(Function));
    });

    it('should reject with an APIError when ffprobe fails', async () => {
      ffmpeg.ffprobe.mockImplementation((filePath, callback) => {
        callback(new Error('ffprobe error'));
      });

      await expect(getVideoMetadata('/path/to/video.mp4')).rejects.toThrow('Failed to process video file.');
    });
  });

  describe('trimVideo', () => {
    it('should resolve when trimming succeeds', async () => {
      const mockCommand = ffmpeg();
      mockCommand.on.mockImplementation((event, cb) => {
        if (event === 'end') {
          setImmediate(cb);
        }
        return mockCommand;
      });

      mockCommand.run();

      await expect(trimVideo('/input.mp4', '/output.mp4', 0, 10)).resolves.toBeUndefined();
    });

    it('should reject with an APIError when trimming fails', async () => {
      const mockCommand = ffmpeg();
      mockCommand.on.mockImplementation((event, cb) => {
        if (event === 'error') {
          setImmediate(() => cb(new Error('trimming error')));
        }
        return mockCommand;
      });

      mockCommand.run();

      await expect(trimVideo('/input.mp4', '/output.mp4', 0, 10)).rejects.toThrow('Failed to trim video: trimming error');
    });
  });

  describe('mergeVideos', () => {
    it('should resolve when merging succeeds', async () => {
      const mockCommand = ffmpeg();
      mockCommand.on.mockImplementation((event, cb) => {
        if (event === 'end') {
          setImmediate(cb);
        }
        return mockCommand;
      });
      mockCommand.run();

      await expect(mergeVideos(['/input1.mp4', '/input2.mp4'], '/output.mp4')).resolves.toBeUndefined();
    });

    it('should reject with an APIError when merging fails', async () => {
      const mockCommand = ffmpeg();
      mockCommand.on.mockImplementation((event, cb) => {
        if (event === 'error') {
          setImmediate(() => cb(new Error('merging error')));
        }
        return mockCommand;
      });
      mockCommand.run();

      await expect(mergeVideos(['/input1.mp4', '/input2.mp4'], '/output.mp4')).rejects.toThrow('Failed to merge videos: merging error');
    });
  });

  describe('validateVideoDuration', () => {
    it('should throw an APIError for duration less than minDuration', () => {
      expect(() => validateVideoDuration(2)).toThrow('Video duration must be between');
    });

    it('should throw an APIError for duration greater than maxDuration', () => {
      expect(() => validateVideoDuration(500)).toThrow('Video duration must be between');
    });

    it('should not throw if duration is within range', () => {
      expect(() => validateVideoDuration(100)).not.toThrow();
    });
  });

  describe('validateTrimTimes', () => {
    it('should throw an APIError if startTime < 0', () => {
      expect(() => validateTrimTimes(-1, 5, 10)).toThrow('Invalid start_time or end_time');
    });

    it('should throw an APIError if endTime > duration', () => {
      expect(() => validateTrimTimes(0, 20, 10)).toThrow('Invalid start_time or end_time');
    });

    it('should throw an APIError if startTime >= endTime', () => {
      expect(() => validateTrimTimes(5, 5, 10)).toThrow('Invalid start_time or end_time');
      expect(() => validateTrimTimes(10, 5, 10)).toThrow('Invalid start_time or end_time');
    });

    it('should not throw if trim times are valid', () => {
      expect(() => validateTrimTimes(0, 5, 10)).not.toThrow();
    });
  });

  describe('deleteVideoFile', () => {
    it('should delete the file successfully', async () => {
      fs.unlink.mockImplementation((_, cb) => cb(null));
      await deleteVideoFile('/path/to/video.mp4');
      expect(console.error).not.toHaveBeenCalled();
    });

    it('should log an error if file deletion fails', async () => {
      fs.unlink.mockImplementation((_, cb) => cb(new Error('deletion error')));
      await deleteVideoFile('/path/to/video.mp4');
      expect(console.error).toHaveBeenCalledWith(
        `Failed to delete file: /path/to/video.mp4, Error: deletion error`
      );
    });
  });
});