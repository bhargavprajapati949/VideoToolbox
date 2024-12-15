import jwt from 'jsonwebtoken';
import config from '../../config.js';
import APIError from '../utils/APIError.js';
import { User } from '../models/index.js';
import logger from '../utils/logger.js';

const jwtSecret = config.get('jwtSecret');

const authMiddleware = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError('Authorization header with Bearer token is missing', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    let decoded;
    try {
      decoded = jwt.verify(token, jwtSecret);
    } catch (error) {
      if (error.name === 'JsonWebTokenError') {
        throw new APIError('Invalid or expired auth token', 401);
      } else if (error.name === 'TokenExpiredError') {
        throw new APIError('Authorization token expired', 401);
      } else {
        throw new APIError('Authorization token verification failed', 401);
      }
    }

    // Check if the user exists in the database
    const user = await User.findByPk(decoded.user_id);
    if (!user) {
      throw new APIError('User does not exist', 401);
    }

    req.user = { user_id: user.user_id, email: user.email };

    next();
  } catch (error) {
    logger.error(`Auth Middleware Error: ${error}`);
    next(error);
  }
};

export default authMiddleware;