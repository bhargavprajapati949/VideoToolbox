import errorHandler from '../../../src/middlewares/errorHandler.js';
import APIError from '../../../src/utils/APIError.js';
import logger from '../../../src/utils/logger.js';
import { MulterError } from 'multer';

jest.mock('../../../src/utils/logger.js', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('errorHandler middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should handle APIError correctly', () => {
    const error = new APIError('Some error', 400);

    errorHandler(error, req, res, next);

    expect(logger.debug).toHaveBeenCalledWith(`Error: ${error.message}, StatusCode: ${error.statusCode}`);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Some error' });
  });

  it('should handle MulterError for LIMIT_FILE_SIZE', () => {
    const error = new MulterError('LIMIT_FILE_SIZE');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: expect.stringContaining('Uploaded file size is too large. Maximum allowed size is'),
    });
  });

  it('should handle other MulterErrors', () => {
    const error = new MulterError('LIMIT_UNEXPECTED_FILE', 'fieldname');

    errorHandler(error, req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: error.message });
  });

  it('should handle unexpected errors', () => {
    const error = new Error('Unexpected');

    errorHandler(error, req, res, next);

    expect(logger.error).toHaveBeenCalledWith('Unexpected Error:', error);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'An unexpected error occurred.' });
  });
});