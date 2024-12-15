import { MulterError } from 'multer';

import config from '../../config.js';
import APIError from '../utils/APIError.js';
import logger from '../utils/logger.js';

const maxSize = config.get('video.maxSize')

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  
  // If the error is an instance of APIError, use its statusCode and message
  if (err instanceof APIError && err.statusCode) {
    logger.debug(`Error: ${err.message}, StatusCode: ${err.statusCode}`);
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxSizeMB = ( maxSize / (1024 * 1024)).toFixed(2);
      return res.status(400).json({ error: `Uploaded file size is too large. Maximum allowed size is ${maxSizeMB} MB.` });
    }
    return res.status(400).json({ error: err.message });
  }


  // For unexpected errors, log and return a generic error message
  logger.error('Unexpected Error:', err);
  return res.status(500).json({ error: 'An unexpected error occurred.' });
};

export default errorHandler;