import request from 'supertest';
import mongoose from 'mongoose';
import { jest } from '@jest/globals';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { Deck } from '../../src/models/Deck.js';
import { Card } from '../../src/models/Card.js';
import { createToken } from '../../src/utils/jwt.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

process.env.JWT_SECRET = 'test-jwt-secret-key-for-fastrev';

describe('Deck Management API (/api/decks)', () => {
  let app;
  let user1;
  let user2;
  let token1;
  let token2;

  beforeAll(async () => {
    await connectTestDb();
    app = createApp();
  });

  beforeEach(async () => {
    await clearTestDb();

    user1 = await User.create({ email: 'user1@example.com', passwordHash: 'hash1' });
    user2 = await User.create({ email: 'user2@example.com', passwordHash: 'hash2' });

    token1 = createToken({ userId: user1._id.toString(), email: user1.email });
    token2 = createToken({ userId: user2._id.toString(), email: user2.email });
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  // -----------------------------------------------------------------------
  // Authentication Enforcement
  // -----------------------------------------------------------------------
  describe('Authentication Enforcement', () => {
    const fakeId = new mongoose.Types.ObjectId().toString();

    test('rejects unauthenticated GET /api/decks with 401', async () => {
      const res = await request(app).get('/api/decks');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects unauthenticated POST /api/decks with 401', async () => {
      const res = await request(app).post('/api/decks').send({ title: 'Test' });
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects unauthenticated GET /api/decks/:id with 401', async () => {
      const res = await request(app).get(`/api/decks/${fakeId}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects unauthenticated DELETE /api/decks/:id with 401', async () => {
      const res = await request(app).delete(`/api/decks/${fakeId}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects invalid or malformed bearer token with 401', async () => {
      const res = await request(app)
        .get('/api/decks')
        .set('Authorization', 'Bearer invalid-jwt-token');
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/decks (List Decks)
  // -----------------------------------------------------------------------
  describe('GET /api/decks (List Decks)', () => {
    test('returns empty array when user has no decks', async () => {
      const res = await request(app)
        .get('/api/decks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ decks: [] });
    });

    test('returns only decks belonging to authenticated user with correct card counts', async () => {
      const deck1A = await Deck.create({ userId: user1._id, title: 'Biology 101' });
      const deck1B = await Deck.create({ userId: user1._id, title: 'Chemistry 101' });

      await Card.create({ deckId: deck1A._id, userId: user1._id, question: 'Q1', answer: 'A1' });
      await Card.create({ deckId: deck1A._id, userId: user1._id, question: 'Q2', answer: 'A2' });
      await Card.create({ deckId: deck1B._id, userId: user1._id, question: 'Q3', answer: 'A3' });

      const deck2A = await Deck.create({ userId: user2._id, title: 'Physics 101' });
      await Card.create({ deckId: deck2A._id, userId: user2._id, question: 'Q4', answer: 'A4' });

      const res = await request(app)
        .get('/api/decks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.decks).toHaveLength(2);

      const titles = res.body.decks.map((d) => d.title);
      expect(titles).toContain('Biology 101');
      expect(titles).toContain('Chemistry 101');
      expect(titles).not.toContain('Physics 101');

      const bioDeck = res.body.decks.find((d) => d.title === 'Biology 101');
      expect(bioDeck.cardCount).toBe(2);

      const chemDeck = res.body.decks.find((d) => d.title === 'Chemistry 101');
      expect(chemDeck.cardCount).toBe(1);

      // Verify no flashcard answers or questions are leaked in list response
      res.body.decks.forEach((d) => {
        expect(d.cards).toBeUndefined();
        expect(d.question).toBeUndefined();
        expect(d.answer).toBeUndefined();
      });
    });

    test('orders decks newest first by creation date', async () => {
      await Deck.create({
        userId: user1._id,
        title: 'Older Deck',
        createdAt: new Date('2026-01-01'),
      });
      await Deck.create({
        userId: user1._id,
        title: 'Newer Deck',
        createdAt: new Date('2026-06-01'),
      });

      const res = await request(app)
        .get('/api/decks')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.decks[0].title).toBe('Newer Deck');
      expect(res.body.decks[1].title).toBe('Older Deck');
    });
  });

  // -----------------------------------------------------------------------
  // POST /api/decks (Create Deck)
  // -----------------------------------------------------------------------
  describe('POST /api/decks (Create Deck)', () => {
    test('creates a deck for the authenticated user with trimmed title', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '   My New Deck   ' });

      expect(res.status).toBe(201);
      expect(res.body.deck.title).toBe('My New Deck');
      expect(res.body.deck.cardCount).toBe(0);
      expect(res.body.deck.id).toBeDefined();

      const inDb = await Deck.findById(res.body.deck.id);
      expect(inDb).not.toBeNull();
      expect(inDb.userId.toString()).toBe(user1._id.toString());
      expect(inDb.title).toBe('My New Deck');
    });

    test('rejects missing title with 400', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects null title with 400', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: null });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects empty title with 400', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects whitespace-only title with 400', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: '     ' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects non-string title with 400', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 12345 });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('rejects title exceeding 120 characters with 400', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'A'.repeat(121) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    test('ignores client-supplied userId and always uses JWT identity', async () => {
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'Protected Deck', userId: user2._id.toString() });

      expect(res.status).toBe(201);
      const inDb = await Deck.findById(res.body.deck.id);
      expect(inDb.userId.toString()).toBe(user1._id.toString());
      expect(inDb.userId.toString()).not.toBe(user2._id.toString());
    });

    test('ignores client-supplied _id', async () => {
      const fakeId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .post('/api/decks')
        .set('Authorization', `Bearer ${token1}`)
        .send({ title: 'ID Test Deck', _id: fakeId });

      expect(res.status).toBe(201);
      expect(res.body.deck.id).not.toBe(fakeId);
    });
  });

  // -----------------------------------------------------------------------
  // GET /api/decks/:id (Retrieve Deck)
  // -----------------------------------------------------------------------
  describe('GET /api/decks/:id (Retrieve Deck)', () => {
    test('retrieves owned deck and its associated cards', async () => {
      const deck = await Deck.create({ userId: user1._id, title: 'Cellular Biology' });
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'What is RNA?', answer: 'Ribonucleic acid' });
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'What is DNA?', answer: 'Deoxyribonucleic acid' });

      const res = await request(app)
        .get(`/api/decks/${deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.deck.title).toBe('Cellular Biology');
      expect(res.body.deck.cardCount).toBe(2);
      expect(res.body.cards).toHaveLength(2);
      expect(res.body.cards[0].question).toBe('What is RNA?');
      expect(res.body.cards[0].answer).toBe('Ribonucleic acid');
      expect(res.body.cards[1].question).toBe('What is DNA?');
    });

    test('returns empty card array for a deck without cards', async () => {
      const deck = await Deck.create({ userId: user1._id, title: 'Empty Deck' });

      const res = await request(app)
        .get(`/api/decks/${deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.deck.cardCount).toBe(0);
      expect(res.body.cards).toEqual([]);
    });

    test('returns 400 for malformed deck ID', async () => {
      const res = await request(app)
        .get('/api/decks/not-a-valid-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    test('returns 404 for non-existent deck', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .get(`/api/decks/${nonExistentId}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('returns indistinguishable 404 when accessing another user deck (no leak)', async () => {
      const user2Deck = await Deck.create({ userId: user2._id, title: 'User 2 Secret Deck' });

      const res = await request(app)
        .get(`/api/decks/${user2Deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('does not expose another user cards even with inconsistent DB data', async () => {
      const deck = await Deck.create({ userId: user1._id, title: 'User 1 Deck' });
      // Insert a card that belongs to user2 but references user1's deck
      await Card.create({ deckId: deck._id, userId: user2._id, question: 'U2 Q', answer: 'U2 A' });
      // Insert a card that belongs to user1
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'U1 Q', answer: 'U1 A' });

      const res = await request(app)
        .get(`/api/decks/${deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.cards).toHaveLength(1);
      expect(res.body.cards[0].question).toBe('U1 Q');
    });
  });

  // -----------------------------------------------------------------------
  // DELETE /api/decks/:id (Delete Deck)
  // -----------------------------------------------------------------------
  describe('DELETE /api/decks/:id (Delete Deck)', () => {
    test('successfully deletes deck and all associated cards', async () => {
      const deck = await Deck.create({ userId: user1._id, title: 'Deck to Delete' });
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'Q1', answer: 'A1' });
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'Q2', answer: 'A2' });

      const res = await request(app)
        .delete(`/api/decks/${deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/deleted successfully/i);

      const deletedDeck = await Deck.findById(deck._id);
      expect(deletedDeck).toBeNull();

      const remainingCards = await Card.find({ deckId: deck._id });
      expect(remainingCards).toHaveLength(0);
    });

    test('does not delete cards or decks belonging to other users', async () => {
      const user1Deck = await Deck.create({ userId: user1._id, title: 'User 1 Deck' });
      await Card.create({ deckId: user1Deck._id, userId: user1._id, question: 'U1Q', answer: 'U1A' });

      const user2Deck = await Deck.create({ userId: user2._id, title: 'User 2 Deck' });
      await Card.create({ deckId: user2Deck._id, userId: user2._id, question: 'U2Q', answer: 'U2A' });

      await request(app)
        .delete(`/api/decks/${user1Deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      const u2DeckCheck = await Deck.findById(user2Deck._id);
      expect(u2DeckCheck).not.toBeNull();

      const u2CardsCheck = await Card.find({ deckId: user2Deck._id });
      expect(u2CardsCheck).toHaveLength(1);
      expect(u2CardsCheck[0].question).toBe('U2Q');
    });

    test('cannot delete another user deck (returns 404)', async () => {
      const user2Deck = await Deck.create({ userId: user2._id, title: 'User 2 Protected Deck' });

      const res = await request(app)
        .delete(`/api/decks/${user2Deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');

      const check = await Deck.findById(user2Deck._id);
      expect(check).not.toBeNull();
    });

    test('returns 400 for malformed deck ID', async () => {
      const res = await request(app)
        .delete('/api/decks/not-an-id')
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('INVALID_ID');
    });

    test('returns 404 for non-existent deck ID', async () => {
      const nonExistent = new mongoose.Types.ObjectId().toString();
      const res = await request(app)
        .delete(`/api/decks/${nonExistent}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe('NOT_FOUND');
    });

    test('handles card deletion failure safely (deck not modified)', async () => {
      const deck = await Deck.create({ userId: user1._id, title: 'Fail Card Delete' });
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'Q1', answer: 'A1' });

      // Spy on Card.deleteMany to throw
      const spy = jest.spyOn(Card, 'deleteMany').mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .delete(`/api/decks/${deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('SERVER_ERROR');

      // Deck should still exist
      const deckCheck = await Deck.findById(deck._id);
      expect(deckCheck).not.toBeNull();

      // Card should still exist (deleteMany failed before deletion)
      const cards = await Card.find({ deckId: deck._id });
      expect(cards).toHaveLength(1);

      spy.mockRestore();
    });

    test('handles deck deletion failure after cards deleted (partial)', async () => {
      const deck = await Deck.create({ userId: user1._id, title: 'Fail Deck Delete' });
      await Card.create({ deckId: deck._id, userId: user1._id, question: 'Q1', answer: 'A1' });

      // Spy on Deck.findByIdAndDelete to throw
      const spy = jest.spyOn(Deck, 'findByIdAndDelete').mockRejectedValueOnce(new Error('DB error'));

      const res = await request(app)
        .delete(`/api/decks/${deck._id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(res.status).toBe(500);
      expect(res.body.error.code).toBe('DELETE_PARTIAL');

      // Cards should be gone (deleted before deck attempt)
      const cards = await Card.find({ deckId: deck._id });
      expect(cards).toHaveLength(0);

      // Deck still exists (delete failed)
      const deckCheck = await Deck.findById(deck._id);
      expect(deckCheck).not.toBeNull();

      spy.mockRestore();
    });
  });
});
