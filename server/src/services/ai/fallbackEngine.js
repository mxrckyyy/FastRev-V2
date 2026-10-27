import env from '../../config/env.js';
import groqAdapter from './providers/groq.js';
import cerebrasAdapter from './providers/cerebras.js';
import geminiAdapter from './providers/gemini.js';
import defaultCooldownManager from './cooldownManager.js';
import { parseFlashcards } from './responseParser.js';
import { ProviderError, ERROR_CODES } from './errors.js';

export const FLASHCARD_SYSTEM_PROMPT =
  'You are an expert study assistant. Generate clear, high-quality question-and-answer flashcards from the provided study material. ' +
  'Output strictly a JSON object with a "cards" array. Each item must have a "question" (concise, direct question) and "answer" (factual, comprehensive answer). ' +
  'Never include markdown code blocks or commentary outside the JSON.';

export class FallbackEngine {
  /**
   * @param {object} [options]
   * @param {Array<object>} [options.providers] - Provider adapters in strict fallback order
   * @param {object} [options.cooldownManager]
   * @param {number} [options.timeoutMs]
   * @param {number} [options.maxRetries]
   * @param {number} [options.cooldownMs]
   * @param {typeof fetch} [options.fetchFn]
   */
  constructor(options = {}) {
    this.providers = options.providers || [groqAdapter, cerebrasAdapter, geminiAdapter];
    this.cooldownManager = options.cooldownManager || defaultCooldownManager;
    this.timeoutMs = options.timeoutMs || env.aiProviderTimeoutMs || 15000;
    this.maxRetries = options.maxRetries !== undefined ? options.maxRetries : (env.aiProviderMaxRetries ?? 1);
    this.cooldownMs = options.cooldownMs || env.aiCooldownMs || 60000;
    this.fetchFn = options.fetchFn || globalThis.fetch;
  }

  /**
   * Generates flashcards by attempting providers in priority order.
   * @param {string} material - Study material
   * @param {object} [options]
   * @param {string} [options.systemPrompt]
   * @returns {Promise<{ provider: string, model: string, latencyMs: number, cards: Array<{ question: string, answer: string }> }>}
   */
  async generateFlashcards(material, options = {}) {
    const systemPrompt = options.systemPrompt || FLASHCARD_SYSTEM_PROMPT;
    const providerFailures = [];

    // Filter to configured providers
    const configuredProviders = this.providers.filter((p) => p.isConfigured());

    if (configuredProviders.length === 0) {
      throw new ProviderError(
        ERROR_CODES.ALL_PROVIDERS_FAILED,
        'No AI providers are configured with API credentials',
        { retryable: false, details: { providerErrors: [] } }
      );
    }

    for (const provider of this.providers) {
      const providerId = provider.id;

      // 1. Skip if not configured
      if (!provider.isConfigured()) {
        providerFailures.push({
          provider: providerId,
          code: ERROR_CODES.PROVIDER_NOT_CONFIGURED,
          message: `${provider.name} is not configured`,
        });
        continue;
      }

      // 2. Skip if cooling down
      if (this.cooldownManager.isCoolingDown(providerId)) {
        const remainingMs = this.cooldownManager.getRemainingMs(providerId);
        providerFailures.push({
          provider: providerId,
          code: ERROR_CODES.PROVIDER_RATE_LIMIT,
          message: `${provider.name} is in cooldown (${Math.ceil(remainingMs / 1000)}s remaining)`,
        });
        continue;
      }

      // 3. Attempt execution with bounded retries for transient errors
      let attempt = 0;
      let providerSuccess = false;
      let lastError = null;

      while (attempt <= this.maxRetries && !providerSuccess) {
        attempt += 1;
        const controller = new AbortController();
        const timer = setTimeout(() => {
          controller.abort();
        }, this.timeoutMs);

        try {
          const rawResult = await provider.execute({
            prompt: material,
            systemPrompt,
            signal: controller.signal,
            fetchFn: this.fetchFn,
          });

          clearTimeout(timer);

          // Parse and validate flashcard response
          const validated = parseFlashcards(rawResult.text, { provider: providerId });

          return {
            provider: rawResult.provider,
            model: rawResult.model,
            latencyMs: rawResult.latencyMs,
            cards: validated.cards,
          };
        } catch (err) {
          clearTimeout(timer);

          const normalizedError =
            err instanceof ProviderError
              ? err
              : new ProviderError(
                  ERROR_CODES.PROVIDER_SERVER_ERROR,
                  err.message || 'Unknown provider error',
                  { provider: providerId, retryable: false }
                );

          lastError = normalizedError;

          // Rate limit: immediately set cooldown and advance to next provider (do not burn retries)
          if (normalizedError.code === ERROR_CODES.PROVIDER_RATE_LIMIT) {
            this.cooldownManager.setCooldown(providerId, this.cooldownMs);
            break;
          }

          // Non-retryable errors (auth, invalid request, response parsing, safety blocks): stop retrying this provider
          if (!normalizedError.retryable) {
            break;
          }

          // Retryable error: continue retry loop if attempts remain
        }
      }

      if (lastError) {
        providerFailures.push({
          provider: providerId,
          code: lastError.code,
          message: lastError.message,
        });
      }
    }

    // All eligible providers failed
    throw new ProviderError(
      ERROR_CODES.ALL_PROVIDERS_FAILED,
      'All AI providers failed to generate flashcards',
      {
        retryable: true,
        details: { providerErrors: providerFailures },
      }
    );
  }
}

export const defaultFallbackEngine = new FallbackEngine();
export default defaultFallbackEngine;