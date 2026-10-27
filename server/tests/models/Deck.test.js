import mongoose from 'mongoose';
import { Deck } from '../../src/models/Deck.js';
import { User } from '../../src/models/User.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

describe('Deck model', () => {
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

  test('creates a valid deck and trims title', async () => {
    const deck = await Deck.create({ userId, title: '  My Deck  ' });
    expect(deck.title).toBe('My Deck');
    expect(deck.userId.toString()).toBe(userId.toString());
  });

  test('rejects missing title', async () => {
    await expect(Deck.create({ userId })).rejects.toThrow();
  });

  test('rejects empty title', async () => {
    await expect(Deck.create({ userId, title: '' })).rejects.toThrow();
  });

  test('rejects whitespace-only title', async () => {
    await expect(Deck.create({ userId, title: '   ' })).rejects.toThrow();
  });

  test('enforces maximum title length', async () => {
    const longTitle = 'a'.repeat(121);
    await expect(Deck.create({ userId, title: longTitle })).rejects.toThrow();
  });

  test('rejects missing userId', async () => {
    await expect(Deck.create({ title: 'Deck' })).rejects.toThrow();
  });

  test('rejects invalid userId type', async () => {
    await expect(Deck.create({ userId: 'not-an-id', title: 'Deck' })).rejects.toThrow();
  });

  test('userId index exists', async () => {
    const indexes = await Deck.collection.indexes();
    const hasUserIdIndex = indexes.some((index) => index.key && index.key.userId === 1);
    expect(hasUserIdIndex).toBe(true);
  });
});