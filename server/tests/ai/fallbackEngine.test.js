import { jest } from '@jest/globals';
import { FallbackEngine } from '../../src/services/ai/fallbackEngine.js';
import { CooldownManager } from '../../src/services/ai/cooldownManager.js';
import { ProviderError, ERROR_CODES } from '../../src/services/ai/errors.js';

describe('FallbackEngine', () => {
  const validCardsJson = JSON.stringify({
    cards: [{ question: 'Sample Question?', answer: 'Sample Answer.' }],
  });

  const createMockProvider = (id, name, isConfigured = true) => ({
    id,
    name,
    isConfigured: jest.fn().mockReturnValue(isConfigured),
    getModel: jest.fn().mockReturnValue(`${id}-model`),
    execute: jest.fn(),
  });

  let groqMock;
  let cerebrasMock;
  let geminiMock;
  let cooldownManager;

  beforeEach(() => {
    groqMock = createMockProvider('groq', 'Groq', true);
    cerebrasMock = createMockProvider('cerebras', 'Cerebras', true);
    geminiMock = createMockProvider('gemini', 'Gemini', true);
    cooldownManager = new CooldownManager({ defaultDurationMs: 60000 });
  });

  test('stops immediately after the first provider (Groq) succeeds', async () => {
    groqMock.execute.mockResolvedValue({
      provider: 'groq',
      model: 'groq-model',
      text: validCardsJson,
      latencyMs: 120,
    });

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
    });

    const result = await engine.generateFlashcards('Study material');

    expect(result.provider).toBe('groq');
    expect(result.cards).toHaveLength(1);
    expect(groqMock.execute).toHaveBeenCalledTimes(1);
    expect(cerebrasMock.execute).not.toHaveBeenCalled();
    expect(geminiMock.execute).not.toHaveBeenCalled();
  });

  test('falls back to Cerebras when Groq fails with server error', async () => {
    groqMock.execute.mockRejectedValue(
      new ProviderError(ERROR_CODES.PROVIDER_SERVER_ERROR, 'Groq 500', { provider: 'groq', retryable: true })
    );
    cerebrasMock.execute.mockResolvedValue({
      provider: 'cerebras',
      model: 'cerebras-model',
      text: validCardsJson,
      latencyMs: 180,
    });

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
      maxRetries: 0, // Test immediate fallback on error
    });

    const result = await engine.generateFlashcards('Study material');

    expect(result.provider).toBe('cerebras');
    expect(groqMock.execute).toHaveBeenCalledTimes(1);
    expect(cerebrasMock.execute).toHaveBeenCalledTimes(1);
    expect(geminiMock.execute).not.toHaveBeenCalled();
  });

  test('triggers cooldown on 429 and advances to next provider', async () => {
    groqMock.execute.mockRejectedValue(
      new ProviderError(ERROR_CODES.PROVIDER_RATE_LIMIT, 'Groq 429', { provider: 'groq', retryable: true })
    );
    cerebrasMock.execute.mockResolvedValue({
      provider: 'cerebras',
      model: 'cerebras-model',
      text: validCardsJson,
      latencyMs: 150,
    });

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
    });

    const result = await engine.generateFlashcards('Study material');

    expect(result.provider).toBe('cerebras');
    expect(cooldownManager.isCoolingDown('groq')).toBe(true);

    // Subsequent request should skip Groq completely without executing it
    groqMock.execute.mockClear();
    cerebrasMock.execute.mockClear();

    const secondResult = await engine.generateFlashcards('More study material');
    expect(secondResult.provider).toBe('cerebras');
    expect(groqMock.execute).not.toHaveBeenCalled();
    expect(cerebrasMock.execute).toHaveBeenCalledTimes(1);
  });

  test('skips unconfigured providers in the chain', async () => {
    groqMock.isConfigured.mockReturnValue(false); // Groq has no API key
    cerebrasMock.execute.mockResolvedValue({
      provider: 'cerebras',
      model: 'cerebras-model',
      text: validCardsJson,
      latencyMs: 200,
    });

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
    });

    const result = await engine.generateFlashcards('Study material');

    expect(result.provider).toBe('cerebras');
    expect(groqMock.execute).not.toHaveBeenCalled();
    expect(cerebrasMock.execute).toHaveBeenCalledTimes(1);
  });

  test('does not retry permanent authentication errors and falls back', async () => {
    groqMock.execute.mockRejectedValue(
      new ProviderError(ERROR_CODES.PROVIDER_AUTH_ERROR, 'Invalid Key', { provider: 'groq', retryable: false })
    );
    cerebrasMock.execute.mockResolvedValue({
      provider: 'cerebras',
      model: 'cerebras-model',
      text: validCardsJson,
      latencyMs: 140,
    });

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
      maxRetries: 2, // Even with maxRetries=2, auth errors should NOT retry
    });

    const result = await engine.generateFlashcards('Material');

    expect(result.provider).toBe('cerebras');
    expect(groqMock.execute).toHaveBeenCalledTimes(1); // Exactly 1 attempt, no useless retries
    expect(cerebrasMock.execute).toHaveBeenCalledTimes(1);
  });

  test('falls back when provider produces invalid/unparseable response', async () => {
    groqMock.execute.mockResolvedValue({
      provider: 'groq',
      model: 'groq-model',
      text: 'Sorry, I am unable to generate flashcards right now.',
      latencyMs: 100,
    });
    cerebrasMock.execute.mockResolvedValue({
      provider: 'cerebras',
      model: 'cerebras-model',
      text: validCardsJson,
      latencyMs: 150,
    });

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
    });

    const result = await engine.generateFlashcards('Material');

    expect(result.provider).toBe('cerebras');
    expect(groqMock.execute).toHaveBeenCalledTimes(1);
    expect(cerebrasMock.execute).toHaveBeenCalledTimes(1);
  });

  test('throws ALL_PROVIDERS_FAILED when all providers fail', async () => {
    groqMock.execute.mockRejectedValue(
      new ProviderError(ERROR_CODES.PROVIDER_SERVER_ERROR, 'Groq down', { provider: 'groq' })
    );
    cerebrasMock.execute.mockRejectedValue(
      new ProviderError(ERROR_CODES.PROVIDER_RATE_LIMIT, 'Cerebras 429', { provider: 'cerebras' })
    );
    geminiMock.execute.mockRejectedValue(
      new ProviderError(ERROR_CODES.PROVIDER_AUTH_ERROR, 'Gemini bad key', { provider: 'gemini' })
    );

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
      maxRetries: 0,
    });

    let caughtError;
    try {
      await engine.generateFlashcards('Material');
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError.code).toBe(ERROR_CODES.ALL_PROVIDERS_FAILED);
    expect(caughtError.details.providerErrors).toHaveLength(3);
    expect(caughtError.details.providerErrors[0].provider).toBe('groq');
    expect(caughtError.details.providerErrors[1].provider).toBe('cerebras');
    expect(caughtError.details.providerErrors[2].provider).toBe('gemini');
  });

  test('throws ALL_PROVIDERS_FAILED immediately if no providers are configured', async () => {
    groqMock.isConfigured.mockReturnValue(false);
    cerebrasMock.isConfigured.mockReturnValue(false);
    geminiMock.isConfigured.mockReturnValue(false);

    const engine = new FallbackEngine({
      providers: [groqMock, cerebrasMock, geminiMock],
      cooldownManager,
    });

    await expect(engine.generateFlashcards('Material')).rejects.toMatchObject({
      code: ERROR_CODES.ALL_PROVIDERS_FAILED,
    });
  });
});