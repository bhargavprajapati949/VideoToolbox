import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

import config from '../../config.js';
import { User } from '../models/index.js';
import APIError from '../utils/APIError.js';

const jwtSecret = config.get('jwtSecret');

// Register a new user
export const registerUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if the email is already registered
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new APIError('Email is already registered.', 400);
    }

    // Create a new user
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: 'User registered successfully', user_id: user.user_id });
  } catch (error) {
    next(error);
  }
};

// Login a user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new APIError('Invalid email or password.', 401);
    }

    // Compare the provided password with the stored hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new APIError('Invalid email or password.', 401);
    }

    // Generate a JWT token
    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({ token });
  } catch (error) {
    next(error);
  }
};