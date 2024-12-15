import jwt from 'jsonwebtoken';
import { User } from '../../../src/models/index.js';
import authMiddleware from '../../../src/middlewares/auth.js';
import APIError from '../../../src/utils/APIError.js';

jest.mock('jsonwebtoken', () => ({
  verify: jest.fn(),
}));

jest.mock('../../../src/models/index.js', () => ({
  User: {
    findByPk: jest.fn(),
  },
}));

jest.mock('../../../src/utils/logger.js', () => ({
  error: jest.fn(),
}));

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('should throw if Authorization header is missing', async () => {
    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(expect.any(APIError));
    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Authorization header with Bearer token is missing');
    expect(error.statusCode).toBe(401);
  });

  it('should throw if token is invalid', async () => {
    req.headers.authorization = 'Bearer invalidtoken';
    jwt.verify.mockImplementation(() => { throw { name: 'JsonWebTokenError' }; });

    await authMiddleware(req, res, next);
    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Invalid or expired auth token');
    expect(error.statusCode).toBe(401);
  });

  it('should throw if token is expired', async () => {
    req.headers.authorization = 'Bearer expiredtoken';
    jwt.verify.mockImplementation(() => { throw { name: 'TokenExpiredError' }; });

    await authMiddleware(req, res, next);
    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Authorization token expired');
    expect(error.statusCode).toBe(401);
  });

  it('should throw if verification fails for another reason', async () => {
    req.headers.authorization = 'Bearer sometoken';
    jwt.verify.mockImplementation(() => { throw new Error('Unknown error'); });

    await authMiddleware(req, res, next);
    const error = next.mock.calls[0][0];
    expect(error.message).toBe('Authorization token verification failed');
    expect(error.statusCode).toBe(401);
  });

  it('should throw if user does not exist in the database', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockReturnValue({ user_id: 123 });
    User.findByPk.mockResolvedValue(null);

    await authMiddleware(req, res, next);
    const error = next.mock.calls[0][0];
    expect(error.message).toBe('User does not exist');
    expect(error.statusCode).toBe(401);
  });

  it('should attach user to req and call next if token and user are valid', async () => {
    req.headers.authorization = 'Bearer validtoken';
    jwt.verify.mockReturnValue({ user_id: 123 });
    User.findByPk.mockResolvedValue({ user_id: 123, email: 'test@example.com' });

    await authMiddleware(req, res, next);
    expect(next).toHaveBeenCalledWith(); // no error
    expect(req.user).toEqual({ user_id: 123, email: 'test@example.com' });
  });
});