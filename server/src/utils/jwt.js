import jwt from 'jsonwebtoken';
import env from '../config/env.js';

const DEFAULT_EXPIRES_IN = '7d';

function getSecret() {
  const secret = env.jwtSecret || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not configured');
  }
  return secret;
}

/**
 * Signs a payload to create a signed JWT.
 * @param {object} payload
 * @param {object} [options]
 * @returns {string}
 */
export function createToken(payload, options = {}) {
  const secret = getSecret();
  const expiresIn = options.expiresIn || DEFAULT_EXPIRES_IN;
  return jwt.sign(payload, secret, { expiresIn });
}

/**
 * Verifies a JWT and returns decoded payload.
 * Throws JsonWebTokenError or TokenExpiredError on invalid/expired token.
 * @param {string} token
 * @returns {object}
 */
export function verifyToken(token) {
  const secret = getSecret();
  return jwt.verify(token, secret);
}

export default {
  createToken,
  verifyToken,
  DEFAULT_EXPIRES_IN,
};