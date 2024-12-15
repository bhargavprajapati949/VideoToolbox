import APIError from '../utils/APIError.js';
import logger from '../utils/logger.js';

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  
  // If the error is an instance of APIError, use its statusCode and message
  if (err instanceof APIError && err.statusCode) {
    logger.debug(`Error: ${err.message}, StatusCode: ${err.statusCode}`);
    return res.status(err.statusCode).json({ error: err.message });
  }

  // For unexpected errors, log and return a generic error message
  logger.error('Unexpected Error:', err);
  res.status(500).json({ error: 'An unexpected error occurred.' });
};

export default errorHandler;