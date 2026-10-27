const DEFAULT_COOLDOWN_MS = 60000; // 60 seconds

export class CooldownManager {
  /**
   * @param {object} [options]
   * @param {number} [options.defaultDurationMs]
   * @param {() => number} [options.clock] - Injectable clock for tests
   */
  constructor(options = {}) {
    this.defaultDurationMs = options.defaultDurationMs || DEFAULT_COOLDOWN_MS;
    this.clock = options.clock || (() => Date.now());
    /** @type {Map<string, number>} */
    this.cooldowns = new Map();
  }

  /**
   * Marks a provider as cooling down until now + durationMs.
   * @param {string} providerId
   * @param {number} [durationMs]
   */
  setCooldown(providerId, durationMs) {
    if (!providerId) return;
    const duration = typeof durationMs === 'number' && durationMs > 0 ? durationMs : this.defaultDurationMs;
    const until = this.clock() + duration;
    this.cooldowns.set(providerId.toLowerCase(), until);
  }

  /**
   * Checks whether a provider is currently cooling down.
   * @param {string} providerId
   * @returns {boolean}
   */
  isCoolingDown(providerId) {
    if (!providerId) return false;
    const until = this.cooldowns.get(providerId.toLowerCase());
    if (!until) return false;
    if (this.clock() >= until) {
      this.cooldowns.delete(providerId.toLowerCase());
      return false;
    }
    return true;
  }

  /**
   * Returns remaining cooldown milliseconds (0 if not cooling down).
   * @param {string} providerId
   * @returns {number}
   */
  getRemainingMs(providerId) {
    if (!providerId) return 0;
    const until = this.cooldowns.get(providerId.toLowerCase());
    if (!until) return 0;
    const remaining = until - this.clock();
    if (remaining <= 0) {
      this.cooldowns.delete(providerId.toLowerCase());
      return 0;
    }
    return remaining;
  }

  /**
   * Resets cooldown state.
   */
  clear() {
    this.cooldowns.clear();
  }
}

export const defaultCooldownManager = new CooldownManager();

export default defaultCooldownManager;