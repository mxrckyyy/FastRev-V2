import { jest } from '@jest/globals';
import { GroqAdapter } from '../../src/services/ai/providers/groq.js';
import { CerebrasAdapter } from '../../src/services/ai/providers/cerebras.js';
import { GeminiAdapter } from '../../src/services/ai/providers/gemini.js';
import { ERROR_CODES } from '../../src/services/ai/errors.js';

describe('AI Provider Adapters', () => {
  describe('GroqAdapter', () => {
    test('throws PROVIDER_NOT_CONFIGURED when apiKey is missing or empty', async () => {
      const adapter = new GroqAdapter({ apiKey: '' });
      expect(adapter.isConfigured()).toBe(false);
      await expect(adapter.execute({ prompt: 'Test' })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        retryable: false,
      });
    });

    test('successfully extracts generated text from valid response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"cards": [{"question":"Q","answer":"A"}]}' } }],
        }),
      });

      const adapter = new GroqAdapter({ apiKey: 'gsk-valid-key', model: 'llama-3.3-70b-versatile' });
      const result = await adapter.execute({ prompt: 'Study notes', fetchFn: mockFetch });

      expect(result.provider).toBe('groq');
      expect(result.model).toBe('llama-3.3-70b-versatile');
      expect(result.text).toBe('{"cards": [{"question":"Q","answer":"A"}]}');
      expect(result.latencyMs).toBeGreaterThanOrEqual(0);
      expect(mockFetch).toHaveBeenCalledTimes(1);
    });

    test('maps 401 / 403 to PROVIDER_AUTH_ERROR', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: async () => ({ error: { message: 'Invalid API Key' } }),
      });

      const adapter = new GroqAdapter({ apiKey: 'bad-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_AUTH_ERROR,
        status: 401,
        retryable: false,
      });
    });

    test('maps 429 to PROVIDER_RATE_LIMIT', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: { get: () => '60' },
        json: async () => ({ error: { message: 'Rate limit exceeded' } }),
      });

      const adapter = new GroqAdapter({ apiKey: 'valid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_RATE_LIMIT,
        status: 429,
        retryable: true,
      });
    });

    test('maps 500 to PROVIDER_SERVER_ERROR', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({ error: { message: 'Internal error' } }),
      });

      const adapter = new GroqAdapter({ apiKey: 'valid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_SERVER_ERROR,
        status: 500,
        retryable: true,
      });
    });

    test('maps AbortError to PROVIDER_TIMEOUT', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      const mockFetch = jest.fn().mockRejectedValue(abortError);

      const adapter = new GroqAdapter({ apiKey: 'valid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_TIMEOUT,
        retryable: true,
      });
    });

    test('maps network failure to PROVIDER_NETWORK_ERROR', async () => {
      const networkError = new TypeError('Failed to fetch');
      const mockFetch = jest.fn().mockRejectedValue(networkError);

      const adapter = new GroqAdapter({ apiKey: 'valid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_NETWORK_ERROR,
        retryable: true,
      });
    });

    test('maps missing choices content to PROVIDER_INVALID_RESPONSE', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ choices: [] }),
      });

      const adapter = new GroqAdapter({ apiKey: 'valid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_INVALID_RESPONSE,
        retryable: false,
      });
    });
  });

  describe('CerebrasAdapter', () => {
    test('throws PROVIDER_NOT_CONFIGURED when apiKey is missing', async () => {
      const adapter = new CerebrasAdapter({ apiKey: '' });
      expect(adapter.isConfigured()).toBe(false);
      await expect(adapter.execute({ prompt: 'Test' })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        retryable: false,
      });
    });

    test('successfully extracts generated text from valid response', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: '{"cards": [{"question":"Cerebras Q","answer":"Cerebras A"}]}' } }],
        }),
      });

      const adapter = new CerebrasAdapter({ apiKey: 'csk-valid-key', model: 'llama3.1-8b' });
      const result = await adapter.execute({ prompt: 'Study material', fetchFn: mockFetch });

      expect(result.provider).toBe('cerebras');
      expect(result.model).toBe('llama3.1-8b');
      expect(result.text).toContain('Cerebras Q');
    });

    test('maps 429 to PROVIDER_RATE_LIMIT', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        headers: { get: () => '30' },
        json: async () => ({ error: 'Rate limit' }),
      });

      const adapter = new CerebrasAdapter({ apiKey: 'valid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_RATE_LIMIT,
        status: 429,
        retryable: true,
      });
    });
  });

  describe('GeminiAdapter', () => {
    test('throws PROVIDER_NOT_CONFIGURED when apiKey is missing', async () => {
      const adapter = new GeminiAdapter({ apiKey: '' });
      expect(adapter.isConfigured()).toBe(false);
      await expect(adapter.execute({ prompt: 'Test' })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
        retryable: false,
      });
    });

    test('successfully extracts text from candidates parts', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: '{"cards": [{"question":"Gemini Q","answer":"Gemini A"}]}' }],
              },
            },
          ],
        }),
      });

      const adapter = new GeminiAdapter({ apiKey: 'gemini-key', model: 'gemini-1.5-flash' });
      const result = await adapter.execute({ prompt: 'Material', fetchFn: mockFetch });

      expect(result.provider).toBe('gemini');
      expect(result.model).toBe('gemini-1.5-flash');
      expect(result.text).toContain('Gemini Q');
    });

    test('maps safety finishReason to PROVIDER_SAFETY_BLOCK', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          candidates: [
            {
              finishReason: 'SAFETY',
              content: { parts: [] },
            },
          ],
        }),
      });

      const adapter = new GeminiAdapter({ apiKey: 'gemini-key' });
      await expect(adapter.execute({ prompt: 'Dangerous query', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_SAFETY_BLOCK,
        retryable: false,
      });
    });

    test('maps promptFeedback.blockReason to PROVIDER_SAFETY_BLOCK', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          promptFeedback: { blockReason: 'SAFETY' },
          candidates: [],
        }),
      });

      const adapter = new GeminiAdapter({ apiKey: 'gemini-key' });
      await expect(adapter.execute({ prompt: 'Blocked prompt', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_SAFETY_BLOCK,
        retryable: false,
      });
    });

    test('maps 400 with API key message to PROVIDER_AUTH_ERROR', async () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ error: { message: 'API key not valid. Please pass a valid API key.' } }),
      });

      const adapter = new GeminiAdapter({ apiKey: 'invalid-key' });
      await expect(adapter.execute({ prompt: 'Test', fetchFn: mockFetch })).rejects.toMatchObject({
        code: ERROR_CODES.PROVIDER_AUTH_ERROR,
        status: 400,
        retryable: false,
      });
    });
  });
});