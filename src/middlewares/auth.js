import jwt from 'jsonwebtoken';

import config from '../../config.js';
import APIError from '../utils/APIError.js';

const jwtSecret = config.get('jwtSecret')

const authMiddleware = (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new APIError('Authorization header with Bearer token is missing', 401);
    }

    const token = authHeader.split(' ')[1];

    // Verify the token
    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new APIError('Invalid or expired token', 401));
    } else {
      next(error);
    }
  }
};

export default authMiddleware;