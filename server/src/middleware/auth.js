import { verifyToken } from '../utils/jwt.js';

/**
 * Authentication middleware that verifies JWT Bearer tokens.
 * Attaches decoded identity to req.user as { userId, email }.
 */
export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
    });
  }

  const parts = authHeader.trim().split(' ');
  if (parts.length !== 2 || parts[0].toLowerCase() !== 'bearer' || !parts[1]) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid authorization header format' },
    });
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);
    if (!decoded || !decoded.userId) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid token payload' },
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };

    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Token has expired' },
      });
    }
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid token' },
    });
  }
}

export default authenticate;