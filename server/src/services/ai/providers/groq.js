import env from '../../../config/env.js';
import { ProviderError, ERROR_CODES } from '../errors.js';

const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

export class GroqAdapter {
  constructor(options = {}) {
    this.id = 'groq';
    this.name = 'Groq';
    this.apiKey = options.apiKey !== undefined ? options.apiKey : env.groqApiKey;
    this.model = options.model || env.groqModel || 'llama-3.3-70b-versatile';
    this.endpoint = options.endpoint || GROQ_ENDPOINT;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim());
  }

  getModel() {
    return this.model;
  }

  /**
   * Executes a prompt request to Groq API.
   * @param {object} params
   * @param {string} params.prompt - Study material or prompt
   * @param {string} [params.systemPrompt]
   * @param {AbortSignal} [params.signal]
   * @param {typeof fetch} [params.fetchFn]
   * @returns {Promise<{ text: string, latencyMs: number, model: string, provider: string }>}
   */
  async execute(params = {}) {
    if (!this.isConfigured()) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        'Groq API key is not configured',
        { provider: this.id, retryable: false }
      );
    }

    const { prompt, systemPrompt, signal, fetchFn = globalThis.fetch } = params;

    const messages = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    const payload = {
      model: this.model,
      messages,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    };

    const startTime = Date.now();

    let response;
    try {
      response = await fetchFn(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if (err.name === 'AbortError' || signal?.aborted) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_TIMEOUT,
          'Groq request timed out',
          { provider: this.id, retryable: true, details: { latencyMs } }
        );
      }
      throw new ProviderError(
        ERROR_CODES.PROVIDER_NETWORK_ERROR,
        'Groq network connection failed',
        { provider: this.id, retryable: true, details: { message: err.message, latencyMs } }
      );
    }

    const latencyMs = Date.now() - startTime;

    if (!response.ok) {
      const status = response.status;
      let errorBody = {};
      try {
        errorBody = await response.json();
      } catch {
        // Safe fallback if not json
      }

      if (status === 401 || status === 403) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_AUTH_ERROR,
          'Groq authentication failed',
          { provider: this.id, status, retryable: false }
        );
      }
      if (status === 429) {
        const retryAfter = response.headers?.get?.('retry-after');
        throw new ProviderError(
          ERROR_CODES.PROVIDER_RATE_LIMIT,
          'Groq rate limit exceeded',
          { provider: this.id, status, retryable: true, details: { retryAfter } }
        );
      }
      if (status === 400) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_INVALID_REQUEST,
          'Groq rejected request as invalid',
          { provider: this.id, status, retryable: false }
        );
      }
      if (status >= 500) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_SERVER_ERROR,
          'Groq server error',
          { provider: this.id, status, retryable: true }
        );
      }

      throw new ProviderError(
        ERROR_CODES.PROVIDER_SERVER_ERROR,
        `Groq request failed with status ${status}`,
        { provider: this.id, status, retryable: false }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        'Groq response could not be parsed as JSON',
        { provider: this.id, retryable: false, details: err.message }
      );
    }

    const text = data?.choices?.[0]?.message?.content;
    if (typeof text !== 'string') {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        'Groq response did not contain expected text choice',
        { provider: this.id, retryable: false }
      );
    }

    return {
      provider: this.id,
      text,
      latencyMs,
      model: this.model,
    };
  }
}

export const groqAdapter = new GroqAdapter();
export default groqAdapter;