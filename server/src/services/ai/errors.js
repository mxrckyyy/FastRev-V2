/**
 * Custom error class for AI provider failures.
 */
export class ProviderError extends Error {
  /**
   * @param {string} code - Standardized error code
   * @param {string} message - Safe error message
   * @param {object} [options]
   * @param {string} [options.provider] - Provider identifier ('groq', 'cerebras', 'gemini')
   * @param {number} [options.status] - HTTP status code if from an HTTP response
   * @param {boolean} [options.retryable] - Whether the error is transient and retryable
   * @param {any} [options.details] - Safe diagnostic details (no secrets or sensitive content)
   */
  constructor(code, message, options = {}) {
    super(message);
    this.name = 'ProviderError';
    this.code = code;
    this.provider = options.provider;
    this.status = options.status;
    this.retryable = Boolean(options.retryable);
    this.details = options.details;
  }
}

export const ERROR_CODES = {
  PROVIDER_NOT_CONFIGURED: 'PROVIDER_NOT_CONFIGURED',
  PROVIDER_AUTH_ERROR: 'PROVIDER_AUTH_ERROR',
  PROVIDER_RATE_LIMIT: 'PROVIDER_RATE_LIMIT',
  PROVIDER_TIMEOUT: 'PROVIDER_TIMEOUT',
  PROVIDER_NETWORK_ERROR: 'PROVIDER_NETWORK_ERROR',
  PROVIDER_SERVER_ERROR: 'PROVIDER_SERVER_ERROR',
  PROVIDER_INVALID_REQUEST: 'PROVIDER_INVALID_REQUEST',
  PROVIDER_INVALID_RESPONSE: 'PROVIDER_INVALID_RESPONSE',
  PROVIDER_SAFETY_BLOCK: 'PROVIDER_SAFETY_BLOCK',
  ALL_PROVIDERS_FAILED: 'ALL_PROVIDERS_FAILED',
};

export default {
  ProviderError,
  ERROR_CODES,
};