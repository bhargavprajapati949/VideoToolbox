import { exec } from 'child_process';
import { checkFFmpegAvailability } from '../../../src/utils/checkFFmpeg.js';
import logger from '../../../src/utils/logger.js';

jest.mock('child_process', () => ({
  exec: jest.fn(),
}));

jest.mock('../../../src/utils/logger.js', () => ({
  info: jest.fn(),
}));

describe('checkFFmpegAvailability', () => {
  it('should resolve if FFmpeg is available', async () => {
    exec.mockImplementation((cmd, callback) => callback(null));

    await expect(checkFFmpegAvailability()).resolves.toBeUndefined();
    expect(logger.info).toHaveBeenCalledWith('FFmpeg is available in the system.');
  });

  it('should reject if FFmpeg is not available', async () => {
    exec.mockImplementation((cmd, callback) => callback(new Error('Command not found')));

    await expect(checkFFmpegAvailability()).rejects.toThrow(
      'FFmpeg is not installed or not available in the system PATH.'
    );
  });
});