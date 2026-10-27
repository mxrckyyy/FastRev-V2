import { jest } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Deck } from '../../src/models/Deck.js';
import { Card } from '../../src/models/Card.js';
import { Generation } from '../../src/models/Generation.js';
import aiService from '../../src/services/ai/aiService.js';
import { ProviderError, ERROR_CODES } from '../../src/services/ai/errors.js';
import { defaultGenerationLimiter, GenerationRateLimiter } from '../../src/middleware/rateLimiter.js';
import { createToken } from '../../src/utils/jwt.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

process.env.JWT_SECRET = 'test-jwt-secret-key-for-fastrev';

describe('POST /api/generate & Rate Limiting', () => {
  let app;
  let user1;
  let user2;
  let token1;
  let token2;

  const mockCards = [
    { question: 'What is mitochondria?', answer: 'The powerhouse of the cell.' },
    { question: 'What is ATP?', answer: 'Adenosine triphosphate, energy currency of the cell.' },
  ];

  beforeAll(async () => {
    await connectTestDb();
    app = createApp();
  });

  beforeEach(async () => {
    await clearTestDb();
    defaultGenerationLimiter.reset();
    jest.restoreAllMocks();

    user1 = await User.create({ email: 'user1@example.com', passwordHash: 'hash1' });
    user2 = await User.create({ email: 'user2@example.com', passwordHash: 'hash2' });

    token1 = createToken({ userId: user1._id.toString(), email: user1.email });
    token2 = createToken({ userId: user2._id.toString(), email: user2.email });
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('Authentication & Authorization', () => {
    test('rejects request with missing token (401)', async () => {
      const res = await request(app)
        .post('/api/generate')
        .send({ material: 'Some study notes' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects request with invalid or expired token (401)', async () => {
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', 'Bearer invalid-token-string')
        .send({ material: 'Some study notes' });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('ignores client-supplied userId and scopes records to authenticated user', async () => {
      jest.spyOn(aiService, 'generateFlashcards').mockResolvedValue({
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        latencyMs: 150,
        cards: mockCards,
      });

      const spoofedUserId = user2._id.toString();

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          material: 'Biology notes',
          userId: spoofedUserId, // Attempt to spoof user2
        });

      expect(res.status).toBe(201);

      // Verify created Deck belongs to user1, NOT user2
      const createdDeck = await Deck.findById(res.body.deck.id);
      expect(createdDeck.userId.toString()).toBe(user1._id.toString());
      expect(createdDeck.userId.toString()).not.toBe(spoofedUserId);

      // Verify created Cards belong to user1
      const cards = await Card.find({ deckId: createdDeck._id });
      expect(cards).toHaveLength(2);
      cards.forEach((c) => {
        expect(c.userId.toString()).toBe(user1._id.toString());
      });

      // Verify Generation ledger belongs to user1
      const gen = await Generation.findById(res.body.generation.id);
      expect(gen.userId.toString()).toBe(user1._id.toString());
    });
  });

  describe('Request Validation', () => {
    test('rejects missing study material (400)', async () => {
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects empty or whitespace-only study material (400)', async () => {
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: '     \n\t   ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects study material exceeding 20,000 characters (400)', async () => {
      const longMaterial = 'a'.repeat(20001);
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: longMaterial });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(res.body.error.message).toMatch(/exceeds maximum length/i);
    });

    test('rejects non-string study material (400)', async () => {
      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: ['not', 'a', 'string'] });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects empty or excessively long deck title (400)', async () => {
      const res1 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Valid material', title: '   ' });

      expect(res1.status).toBe(400);
      expect(res1.body.error.code).toBe('VALIDATION_ERROR');

      defaultGenerationLimiter.reset();

      const res2 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Valid material', title: 't'.repeat(121) });

      expect(res2.status).toBe(400);
      expect(res2.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects invalid desired card count (400)', async () => {
      const res1 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Valid material', cardCount: 0 });
      expect(res1.status).toBe(400);

      defaultGenerationLimiter.reset();

      const res2 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Valid material', cardCount: 51 });
      expect(res2.status).toBe(400);

      defaultGenerationLimiter.reset();

      const res3 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Valid material', cardCount: 5.5 });
      expect(res3.status).toBe(400);
    });

    test('invalid requests do not create generation records or invoke AI', async () => {
      const spy = jest.spyOn(aiService, 'generateFlashcards');

      await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: '' });

      expect(spy).not.toHaveBeenCalled();
      const count = await Generation.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe('Successful Generation & Persistence', () => {
    test('successfully generates, persists deck and cards, and completes generation ledger', async () => {
      const aiSpy = jest.spyOn(aiService, 'generateFlashcards').mockResolvedValue({
        provider: 'groq',
        model: 'llama-3.3-70b-versatile',
        latencyMs: 250,
        cards: mockCards,
      });

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          material: 'Photosynthesis occurs in plants...',
          title: 'Cellular Biology',
          cardCount: 2,
        });

      expect(res.status).toBe(201);
      expect(aiSpy).toHaveBeenCalledTimes(1);

      // Verify response structure
      expect(res.body.deck).toMatchObject({
        title: 'Cellular Biology',
        cardCount: 2,
      });
      expect(res.body.cards).toHaveLength(2);
      expect(res.body.generation).toMatchObject({
        provider: 'groq',
      });
      expect(res.body.generation.latencyMs).toBeGreaterThanOrEqual(0);

      // Verify database persistence
      const savedDeck = await Deck.findById(res.body.deck.id);
      expect(savedDeck).not.toBeNull();
      expect(savedDeck.title).toBe('Cellular Biology');

      const savedCards = await Card.find({ deckId: savedDeck._id });
      expect(savedCards).toHaveLength(2);
      expect(savedCards[0].question).toBe(mockCards[0].question);
      expect(savedCards[0].answer).toBe(mockCards[0].answer);

      const ledger = await Generation.findById(res.body.generation.id);
      expect(ledger.status).toBe('completed');
      expect(ledger.provider).toBe('groq');
      expect(ledger.cardCount).toBe(2);
      expect(ledger.error).toBeUndefined();
    });

    test('uses default title when title is omitted', async () => {
      jest.spyOn(aiService, 'generateFlashcards').mockResolvedValue({
        provider: 'cerebras',
        model: 'llama3.1-8b',
        latencyMs: 180,
        cards: mockCards,
      });

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Physics notes on gravity.' });

      expect(res.status).toBe(201);
      expect(res.body.deck.title).toMatch(/^Study Deck - /);
    });
  });

  describe('Provider Failures & Ledger Tracking', () => {
    test('records failed status in generation ledger and returns 503 when AI providers fail', async () => {
      jest.spyOn(aiService, 'generateFlashcards').mockRejectedValue(
        new ProviderError(ERROR_CODES.ALL_PROVIDERS_FAILED, 'All AI providers failed to generate flashcards')
      );

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Some study notes' });

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe('PROVIDER_FAILED');

      // Verify no decks or cards were created
      expect(await Deck.countDocuments()).toBe(0);
      expect(await Card.countDocuments()).toBe(0);

      // Verify generation ledger record is marked 'failed'
      const ledger = await Generation.findOne({ userId: user1._id });
      expect(ledger).not.toBeNull();
      expect(ledger.status).toBe('failed');
      expect(ledger.error).toBeDefined();
      expect(ledger.error).toMatch(/All AI providers failed/i);
    });

    test('sanitizes and bounds error messages in generation ledger', async () => {
      const sensitiveError = 'Failed with Bearer secret-token-12345 and mongodb://invalid.invalid/test';
      jest.spyOn(aiService, 'generateFlashcards').mockRejectedValue(
        new Error(sensitiveError)
      );

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Notes' });

      expect(res.status).toBe(500);

      const ledger = await Generation.findOne({ userId: user1._id });
      expect(ledger.status).toBe('failed');
      expect(ledger.error).not.toMatch(/secret-token-12345/);
      expect(ledger.error).not.toMatch(/admin:pass/);
      expect(ledger.error).toMatch(/\[REDACTED\]/);
    });
  });

  describe('Compensating Cleanup on Partial Persistence Failure', () => {
    test('deletes created deck and cards if card insertion fails', async () => {
      jest.spyOn(aiService, 'generateFlashcards').mockResolvedValue({
        provider: 'groq',
        model: 'groq-model',
        latencyMs: 100,
        cards: mockCards,
      });

      // Force Card.insertMany to fail
      jest.spyOn(Card, 'insertMany').mockRejectedValueOnce(new Error('Simulated DB Card Write Error'));

      const res = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Notes', title: 'Deck To Cleanup' });

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('GENERATION_FAILED');

      // Ensure no dangling deck or cards remain in DB
      const remainingDecks = await Deck.find({ title: 'Deck To Cleanup' });
      expect(remainingDecks).toHaveLength(0);
      const remainingCards = await Card.find({ userId: user1._id });
      expect(remainingCards).toHaveLength(0);

      // Ledger is recorded as failed
      const ledger = await Generation.findOne({ userId: user1._id });
      expect(ledger.status).toBe('failed');
    });
  });

  describe('Rate Limiting (5s Cooldown & 30/hr Window)', () => {
    test('enforces 5-second cooldown between consecutive requests for the same user', async () => {
      jest.spyOn(aiService, 'generateFlashcards').mockResolvedValue({
        provider: 'groq',
        model: 'model',
        latencyMs: 100,
        cards: mockCards,
      });

      // Request 1: succeeds
      const res1 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Material 1' });
      expect(res1.status).toBe(201);

      // Request 2 (immediate): rejected with 429
      const res2 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'Material 2' });

      expect(res2.status).toBe(429);
      expect(res2.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(res2.headers['retry-after']).toBeDefined();
    });

    test('allows different users to generate without blocking each other', async () => {
      jest.spyOn(aiService, 'generateFlashcards').mockResolvedValue({
        provider: 'groq',
        model: 'model',
        latencyMs: 100,
        cards: mockCards,
      });

      // User 1 requests: succeeds
      const res1 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token1}`)
        .send({ material: 'User 1 Material' });
      expect(res1.status).toBe(201);

      // User 2 requests immediately: also succeeds (independent limits)
      const res2 = await request(app)
        .post('/api/generate')
        .set('Authorization', `Bearer ${token2}`)
        .send({ material: 'User 2 Material' });
      expect(res2.status).toBe(201);
    });

    test('deterministic test of 5s cooldown and 30/hour limit via GenerationRateLimiter unit', () => {
      let mockTime = 10000000;
      const limiter = new GenerationRateLimiter({
        clock: () => mockTime,
        cooldownMs: 5000,
        hourlyWindowMs: 3600000,
        maxHourlyRequests: 30,
      });

      const uId = 'user-test-rate-limit';

      // 1st request: allowed
      expect(limiter.checkAndRecord(uId).allowed).toBe(true);

      // 2 seconds later: rejected by 5s cooldown
      mockTime += 2000;
      const blockedCooldown = limiter.checkAndRecord(uId);
      expect(blockedCooldown.allowed).toBe(false);
      expect(blockedCooldown.retryAfterSeconds).toBe(3); // 5000 - 2000 = 3000ms = 3s

      // 5 seconds after 1st request: allowed
      mockTime += 3001; // total 5001ms elapsed
      expect(limiter.checkAndRecord(uId).allowed).toBe(true);

      // Execute 28 more allowed requests spaced by 6 seconds (total 30 in window)
      for (let i = 3; i <= 30; i += 1) {
        mockTime += 6000;
        const res = limiter.checkAndRecord(uId);
        expect(res.allowed).toBe(true);
      }

      // 31st request within the 1-hour window: rejected by 30/hour limit
      mockTime += 6000;
      const blockedHourly = limiter.checkAndRecord(uId);
      expect(blockedHourly.allowed).toBe(false);
      expect(blockedHourly.reason).toMatch(/hourly generation limit/i);
      expect(blockedHourly.retryAfterSeconds).toBeGreaterThan(0);

      // Advance clock past the 1-hour window of the first request
      mockTime += 3600000;
      const resAfterHour = limiter.checkAndRecord(uId);
      expect(resAfterHour.allowed).toBe(true);
    });
  });
});