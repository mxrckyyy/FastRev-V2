import mongoose from 'mongoose';
import { Generation } from '../../src/models/Generation.js';
import { User } from '../../src/models/User.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

describe('Generation model', () => {
  let userId;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const user = await User.create({ email: 'owner@example.com', passwordHash: 'hash' });
    userId = user._id;
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('creates a valid generation with defaults', async () => {
    const gen = await Generation.create({ userId });
    expect(gen.status).toBe('reserved');
    expect(gen.cardCount).toBe(0);
    expect(gen.provider).toBeUndefined();
    expect(gen.latencyMs).toBeUndefined();
  });

  test('accepts completed status with metadata', async () => {
    const gen = await Generation.create({
      userId,
      provider: 'groq',
      status: 'completed',
      cardCount: 5,
      latencyMs: 123.5,
    });
    expect(gen.status).toBe('completed');
    expect(gen.provider).toBe('groq');
    expect(gen.cardCount).toBe(5);
    expect(gen.latencyMs).toBe(123.5);
  });

  test('accepts failed status with bounded error', async () => {
    const gen = await Generation.create({
      userId,
      provider: 'Gemini',
      status: 'failed',
      error: '  provider timeout  ',
    });
    expect(gen.status).toBe('failed');
    expect(gen.error).toBe('provider timeout');
  });

  test('rejects unsupported status', async () => {
    await expect(Generation.create({ userId, status: 'pending' })).rejects.toThrow();
  });

  test('rejects invalid provider', async () => {
    await expect(Generation.create({ userId, provider: 'openai' })).rejects.toThrow();
  });

  test('rejects missing userId', async () => {
    await expect(Generation.create({ status: 'reserved' })).rejects.toThrow();
  });

  test('rejects invalid userId type', async () => {
    await expect(Generation.create({ userId: 'bad', status: 'reserved' })).rejects.toThrow();
  });

  test('rejects negative card count', async () => {
    await expect(Generation.create({ userId, cardCount: -1 })).rejects.toThrow();
  });

  test('rejects fractional card count', async () => {
    await expect(Generation.create({ userId, cardCount: 1.5 })).rejects.toThrow();
  });

  test('rejects negative latency', async () => {
    await expect(Generation.create({ userId, latencyMs: -1 })).rejects.toThrow();
  });

  test('enforces error max length', async () => {
    const longError = 'e'.repeat(501);
    await expect(Generation.create({ userId, error: longError })).rejects.toThrow();
  });

  test('userId index exists', async () => {
    const indexes = await Generation.collection.indexes();
    const hasUserIdIndex = indexes.some((index) => index.key && index.key.userId === 1);
    expect(hasUserIdIndex).toBe(true);
  });
});