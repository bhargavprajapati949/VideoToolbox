import { registerUser, loginUser } from '../../../src/controllers/userController.js';
import { User } from '../../../src/models/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import APIError from '../../../src/utils/APIError.js';

jest.mock('../../../src/models/index.js', () => ({
  User: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));

describe('userController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should return 400 if email is already registered', async () => {
      req.body = { email: 'test@example.com', password: 'password123' };
      User.findOne.mockResolvedValue({ email: 'test@example.com' });

      await registerUser(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(APIError));
      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Email is already registered.');
      expect(error.statusCode).toBe(400);
    });

    it('should register a new user and return 201', async () => {
      req.body = { email: 'newuser@example.com', password: 'password123' };
      User.findOne.mockResolvedValue(null);
      bcrypt.hash.mockResolvedValue('hashedpassword');
      User.create.mockResolvedValue({ user_id: 1 });

      await registerUser(req, res, next);

      expect(User.create).toHaveBeenCalledWith({ email: 'newuser@example.com', password: 'hashedpassword' });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: 'User registered successfully', user_id: 1 });
    });
  });

  describe('loginUser', () => {
    it('should return 401 if user does not exist', async () => {
      req.body = { email: 'no@example.com', password: 'password123' };
      User.findOne.mockResolvedValue(null);

      await loginUser(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid email or password.');
      expect(error.statusCode).toBe(401);
    });

    it('should return 401 if password is invalid', async () => {
      req.body = { email: 'test@example.com', password: 'wrongpassword' };
      User.findOne.mockResolvedValue({ email: 'test@example.com', password: 'hashedpass' });
      bcrypt.compare.mockResolvedValue(false);

      await loginUser(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error.message).toBe('Invalid email or password.');
      expect(error.statusCode).toBe(401);
    });

    it('should return a token if credentials are valid', async () => {
      req.body = { email: 'valid@example.com', password: 'password123' };
      User.findOne.mockResolvedValue({ user_id: 10, email: 'valid@example.com', password: 'hashedpass' });
      bcrypt.compare.mockResolvedValue(true);
      jwt.sign.mockReturnValue('jwtToken');

      await loginUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ token: 'jwtToken' });
    });
  });
});