import mongoose from 'mongoose';
import { Card } from '../../src/models/Card.js';
import { User } from '../../src/models/User.js';
import { Deck } from '../../src/models/Deck.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

describe('Card model', () => {
  let userId;
  let deckId;

  beforeAll(async () => {
    await connectTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
    const user = await User.create({ email: 'owner@example.com', passwordHash: 'hash' });
    userId = user._id;
    const deck = await Deck.create({ userId, title: 'Deck' });
    deckId = deck._id;
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('creates a valid card and trims fields', async () => {
    const card = await Card.create({
      deckId,
      userId,
      question: '  What is 2+2?  ',
      answer: '  4  ',
    });
    expect(card.question).toBe('What is 2+2?');
    expect(card.answer).toBe('4');
  });

  test('rejects missing question', async () => {
    await expect(Card.create({ deckId, userId, answer: 'A' })).rejects.toThrow();
  });

  test('rejects missing answer', async () => {
    await expect(Card.create({ deckId, userId, question: 'Q' })).rejects.toThrow();
  });

  test('rejects empty question', async () => {
    await expect(Card.create({ deckId, userId, question: '', answer: 'A' })).rejects.toThrow();
  });

  test('rejects whitespace-only question', async () => {
    await expect(Card.create({ deckId, userId, question: '   ', answer: 'A' })).rejects.toThrow();
  });

  test('rejects empty answer', async () => {
    await expect(Card.create({ deckId, userId, question: 'Q', answer: '' })).rejects.toThrow();
  });

  test('rejects whitespace-only answer', async () => {
    await expect(Card.create({ deckId, userId, question: 'Q', answer: '   ' })).rejects.toThrow();
  });

  test('enforces maximum question length', async () => {
    const longQuestion = 'q'.repeat(2001);
    await expect(Card.create({ deckId, userId, question: longQuestion, answer: 'A' })).rejects.toThrow();
  });

  test('enforces maximum answer length', async () => {
    const longAnswer = 'a'.repeat(5001);
    await expect(Card.create({ deckId, userId, question: 'Q', answer: longAnswer })).rejects.toThrow();
  });

  test('rejects missing deckId', async () => {
    await expect(Card.create({ userId, question: 'Q', answer: 'A' })).rejects.toThrow();
  });

  test('rejects missing userId', async () => {
    await expect(Card.create({ deckId, question: 'Q', answer: 'A' })).rejects.toThrow();
  });

  test('rejects invalid deckId type', async () => {
    await expect(Card.create({ deckId: 'bad', userId, question: 'Q', answer: 'A' })).rejects.toThrow();
  });

  test('rejects invalid userId type', async () => {
    await expect(Card.create({ deckId, userId: 'bad', question: 'Q', answer: 'A' })).rejects.toThrow();
  });

  test('indexes exist', async () => {
    const indexes = await Card.collection.indexes();
    const hasDeckUserIndex = indexes.some((index) => index.key && index.key.deckId === 1 && index.key.userId === 1);
    const hasUserIndex = indexes.some((index) => index.key && index.key.userId === 1 && !index.key.deckId);
    expect(hasDeckUserIndex).toBe(true);
    expect(hasUserIndex).toBe(true);
  });
});