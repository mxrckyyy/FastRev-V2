import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Validates password meets complexity / length policies.
 * @param {any} password
 * @returns {{ valid: boolean, error?: string }}
 */
export function validatePassword(password) {
  if (typeof password !== 'string') {
    return { valid: false, error: 'Password must be a string' };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters long`,
    };
  }
  if (password.length > MAX_PASSWORD_LENGTH) {
    return {
      valid: false,
      error: `Password must be at most ${MAX_PASSWORD_LENGTH} characters long`,
    };
  }
  return { valid: true };
}

/**
 * Hashes a plaintext password using bcryptjs.
 * @param {string} password
 * @returns {Promise<string>}
 */
export async function hashPassword(password) {
  const validation = validatePassword(password);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * @param {string} password
 * @param {string} hash
 * @returns {Promise<boolean>}
 */
export async function comparePassword(password, hash) {
  if (typeof password !== 'string' || typeof hash !== 'string' || !hash) {
    return false;
  }
  return bcrypt.compare(password, hash);
}

export default {
  validatePassword,
  hashPassword,
  comparePassword,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH,
};