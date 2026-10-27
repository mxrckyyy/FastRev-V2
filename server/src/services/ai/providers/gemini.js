import env from '../../../config/env.js';
import { ProviderError, ERROR_CODES } from '../errors.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

export class GeminiAdapter {
  constructor(options = {}) {
    this.id = 'gemini';
    this.name = 'Gemini';
    this.apiKey = options.apiKey !== undefined ? options.apiKey : env.geminiApiKey;
    this.model = options.model || env.geminiModel || 'gemini-1.5-flash';
    this.baseUrl = options.baseUrl || GEMINI_BASE_URL;
  }

  isConfigured() {
    return Boolean(this.apiKey && this.apiKey.trim());
  }

  getModel() {
    return this.model;
  }

  /**
   * Executes a prompt request to Google Gemini API.
   * @param {object} params
   * @param {string} params.prompt
   * @param {string} [params.systemPrompt]
   * @param {AbortSignal} [params.signal]
   * @param {typeof fetch} [params.fetchFn]
   * @returns {Promise<{ text: string, latencyMs: number, model: string, provider: string }>}
   */
  async execute(params = {}) {
    if (!this.isConfigured()) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        'Gemini API key is not configured',
        { provider: this.id, retryable: false }
      );
    }

    const { prompt, systemPrompt, signal, fetchFn = globalThis.fetch } = params;

    const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [{ text: fullPrompt }],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    };

    const url = `${this.baseUrl}/${encodeURIComponent(this.model)}:generateContent?key=${encodeURIComponent(this.apiKey)}`;
    const startTime = Date.now();

    let response;
    try {
      response = await fetchFn(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal,
      });
    } catch (err) {
      const latencyMs = Date.now() - startTime;
      if (err.name === 'AbortError' || signal?.aborted) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_TIMEOUT,
          'Gemini request timed out',
          { provider: this.id, retryable: true, details: { latencyMs } }
        );
      }
      throw new ProviderError(
        ERROR_CODES.PROVIDER_NETWORK_ERROR,
        'Gemini network connection failed',
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
        // Safe fallback
      }

      const errorMessage = errorBody?.error?.message || '';

      if (status === 400 && errorMessage.toLowerCase().includes('api key')) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_AUTH_ERROR,
          'Gemini API key is invalid',
          { provider: this.id, status, retryable: false }
        );
      }
      if (status === 401 || status === 403) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_AUTH_ERROR,
          'Gemini authentication failed',
          { provider: this.id, status, retryable: false }
        );
      }
      if (status === 429) {
        const retryAfter = response.headers?.get?.('retry-after');
        throw new ProviderError(
          ERROR_CODES.PROVIDER_RATE_LIMIT,
          'Gemini rate limit exceeded',
          { provider: this.id, status, retryable: true, details: { retryAfter } }
        );
      }
      if (status === 400) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_INVALID_REQUEST,
          'Gemini rejected request as invalid',
          { provider: this.id, status, retryable: false }
        );
      }
      if (status >= 500) {
        throw new ProviderError(
          ERROR_CODES.PROVIDER_SERVER_ERROR,
          'Gemini server error',
          { provider: this.id, status, retryable: true }
        );
      }

      throw new ProviderError(
        ERROR_CODES.PROVIDER_SERVER_ERROR,
        `Gemini request failed with status ${status}`,
        { provider: this.id, status, retryable: false }
      );
    }

    let data;
    try {
      data = await response.json();
    } catch (err) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        'Gemini response could not be parsed as JSON',
        { provider: this.id, retryable: false, details: err.message }
      );
    }

    // Check for safety block
    if (data.promptFeedback?.blockReason) {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_SAFETY_BLOCK,
        `Gemini prompt blocked due to ${data.promptFeedback.blockReason}`,
        { provider: this.id, retryable: false }
      );
    }

    const candidate = data?.candidates?.[0];
    if (candidate?.finishReason === 'SAFETY') {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_SAFETY_BLOCK,
        'Gemini generation blocked by safety policy',
        { provider: this.id, retryable: false }
      );
    }

    const text = candidate?.content?.parts?.[0]?.text;
    if (typeof text !== 'string') {
      throw new ProviderError(
        ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        'Gemini response did not contain expected content parts',
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

export const geminiAdapter = new GeminiAdapter();
export default geminiAdapter;