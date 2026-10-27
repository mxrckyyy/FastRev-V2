import User from '../models/User.js';
import { hashPassword, comparePassword, validatePassword } from '../utils/password.js';
import { createToken } from '../utils/jwt.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Register a new user with email and password.
 * POST /api/auth/register
 */
export async function register(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
      });
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email cannot be empty' },
      });
    }

    const normalizedEmail = trimmedEmail.toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Invalid email format' },
      });
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: passwordValidation.error },
      });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Email is already registered' },
      });
    }

    const passwordHash = await hashPassword(password);

    let user;
    try {
      user = await User.create({
        email: normalizedEmail,
        passwordHash,
      });
    } catch (createErr) {
      if (createErr.code === 11000) {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Email is already registered' },
        });
      }
      throw createErr;
    }

    const token = createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Log in an existing user.
 * POST /api/auth/login
 */
export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
      });
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Email cannot be empty' },
      });
    }

    const normalizedEmail = trimmedEmail.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    // Generic error response to prevent user enumeration
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' },
      });
    }

    const token = createToken({
      userId: user._id.toString(),
      email: user.email,
    });

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Get current authenticated user's profile.
 * GET /api/auth/me
 */
export async function getMe(req, res, next) {
  try {
    const user = await User.findById(req.user.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      });
    }

    return res.status(200).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (err) {
    next(err);
  }
}

export default {
  register,
  login,
  getMe,
};