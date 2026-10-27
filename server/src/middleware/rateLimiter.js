const COOLDOWN_MS = 5000; // 5 seconds between requests
const HOURLY_WINDOW_MS = 3600000; // 1 hour rolling window
const MAX_HOURLY_REQUESTS = 30;

export class GenerationRateLimiter {
  /**
   * @param {object} [options]
   * @param {() => number} [options.clock] - Injectable clock for testing
   * @param {number} [options.cooldownMs]
   * @param {number} [options.hourlyWindowMs]
   * @param {number} [options.maxHourlyRequests]
   */
  constructor(options = {}) {
    this.clock = options.clock || (() => Date.now());
    this.cooldownMs = options.cooldownMs !== undefined ? options.cooldownMs : COOLDOWN_MS;
    this.hourlyWindowMs = options.hourlyWindowMs !== undefined ? options.hourlyWindowMs : HOURLY_WINDOW_MS;
    this.maxHourlyRequests = options.maxHourlyRequests !== undefined ? options.maxHourlyRequests : MAX_HOURLY_REQUESTS;
    /** @type {Map<string, number[]>} */
    this.userRequests = new Map();
  }

  /**
   * Checks if user is rate limited and records the attempt if allowed.
   * @param {string} userId
   * @returns {{ allowed: boolean, retryAfterSeconds?: number, reason?: string }}
   */
  checkAndRecord(userId) {
    if (!userId) {
      return { allowed: true };
    }

    const now = this.clock();
    const history = this.userRequests.get(userId) || [];

    // Filter out requests older than the rolling hourly window
    const validHistory = history.filter((timestamp) => now - timestamp < this.hourlyWindowMs);

    // 1. Check 5-second cooldown
    if (validHistory.length > 0) {
      const lastRequestTime = validHistory[validHistory.length - 1];
      const elapsedSinceLast = now - lastRequestTime;
      if (elapsedSinceLast < this.cooldownMs) {
        const remainingMs = this.cooldownMs - elapsedSinceLast;
        const retryAfterSeconds = Math.max(1, Math.ceil(remainingMs / 1000));
        return {
          allowed: false,
          retryAfterSeconds,
          reason: 'Please wait at least 5 seconds between generation requests',
        };
      }
    }

    // 2. Check 30 requests per rolling hour
    if (validHistory.length >= this.maxHourlyRequests) {
      const oldestInWindow = validHistory[0];
      const remainingWindowMs = this.hourlyWindowMs - (now - oldestInWindow);
      const retryAfterSeconds = Math.max(1, Math.ceil(remainingWindowMs / 1000));
      return {
        allowed: false,
        retryAfterSeconds,
        reason: 'Hourly generation limit reached (maximum 30 per hour). Please try again later.',
      };
    }

    // Allowed: record request timestamp
    validHistory.push(now);
    this.userRequests.set(userId, validHistory);

    return { allowed: true };
  }

  /**
   * Clears in-memory history (useful between tests).
   */
  reset() {
    this.userRequests.clear();
  }

  /**
   * Express middleware wrapper.
   */
  middleware() {
    return (req, res, next) => {
      const userId = req.user?.userId;
      if (!userId) {
        // If unauthenticated, let auth middleware or downstream handle it
        return next();
      }

      const result = this.checkAndRecord(userId);
      if (!result.allowed) {
        if (result.retryAfterSeconds) {
          res.set('Retry-After', String(result.retryAfterSeconds));
        }
        return res.status(429).json({
          error: {
            code: 'RATE_LIMIT_EXCEEDED',
            message: result.reason,
            retryAfter: result.retryAfterSeconds,
          },
        });
      }

      next();
    };
  }
}

export const defaultGenerationLimiter = new GenerationRateLimiter();
export const generationRateLimiter = defaultGenerationLimiter.middleware();

export default defaultGenerationLimiter;