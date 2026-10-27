import request from 'supertest';
import jwt from 'jsonwebtoken';
import express from 'express';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { authenticate } from '../../src/middleware/auth.js';
import { createToken } from '../../src/utils/jwt.js';
import { hashPassword } from '../../src/utils/password.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

const TEST_SECRET = 'test-jwt-secret-key-for-fastrev';
process.env.JWT_SECRET = TEST_SECRET;

describe('Authentication Middleware & Protected Routes', () => {
  let app;
  let testUser;

  beforeAll(async () => {
    await connectTestDb();
    app = createApp();
  });

  beforeEach(async () => {
    await clearTestDb();
    const passwordHash = await hashPassword('password123');
    testUser = await User.create({ email: 'authtest@example.com', passwordHash });
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  describe('authenticate middleware directly', () => {
    let dummyApp;

    beforeAll(() => {
      dummyApp = express();
      dummyApp.use(express.json());
      dummyApp.get('/test-protected', authenticate, (req, res) => {
        // Demonstrate that downstream handlers rely only on verified req.user.userId
        res.json({
          authenticatedUserId: req.user.userId,
          email: req.user.email,
        });
      });
      dummyApp.post('/test-protected-override', authenticate, (req, res) => {
        // Even if client attempts to spoof userId via body, verified identity remains intact
        res.json({
          authenticatedUserId: req.user.userId,
          bodyUserId: req.body.userId,
        });
      });
    });

    test('accepts valid Bearer token and attaches req.user', async () => {
      const token = createToken({ userId: testUser._id.toString(), email: testUser.email });
      const res = await request(dummyApp)
        .get('/test-protected')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.authenticatedUserId).toBe(testUser._id.toString());
      expect(res.body.email).toBe(testUser.email);
    });

    test('rejects missing Authorization header with 401', async () => {
      const res = await request(dummyApp).get('/test-protected');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toMatch(/authentication required/i);
    });

    test('rejects non-Bearer authorization scheme', async () => {
      const res = await request(dummyApp)
        .get('/test-protected')
        .set('Authorization', 'Basic dXNlcjpwYXNz');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    test('rejects malformed authorization header', async () => {
      const malformedHeaders = ['Bearer', 'Bearer token1 token2', 'JustRandomString'];
      for (const header of malformedHeaders) {
        const res = await request(dummyApp)
          .get('/test-protected')
          .set('Authorization', header);
        expect(res.status).toBe(401);
        expect(res.body.error.code).toBe('UNAUTHORIZED');
      }
    });

    test('rejects token signed with invalid / different secret', async () => {
      const wrongSecretToken = jwt.sign(
        { userId: testUser._id.toString(), email: testUser.email },
        'completely-wrong-secret-key'
      );

      const res = await request(dummyApp)
        .get('/test-protected')
        .set('Authorization', `Bearer ${wrongSecretToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Invalid token');
    });

    test('rejects expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString(), email: testUser.email },
        TEST_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(dummyApp)
        .get('/test-protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
      expect(res.body.error.message).toBe('Token has expired');
    });

    test('client-supplied user IDs in request body cannot override verified identity', async () => {
      const token = createToken({ userId: testUser._id.toString(), email: testUser.email });
      const spoofedUserId = '654321654321654321654321';

      const res = await request(dummyApp)
        .post('/test-protected-override')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: spoofedUserId });

      expect(res.status).toBe(200);
      expect(res.body.authenticatedUserId).toBe(testUser._id.toString());
      expect(res.body.authenticatedUserId).not.toBe(spoofedUserId);
    });
  });

  describe('GET /api/auth/me', () => {
    test('returns current authenticated user profile with safe data', async () => {
      const token = createToken({ userId: testUser._id.toString(), email: testUser.email });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.id).toBe(testUser._id.toString());
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.passwordHash).toBeUndefined();
    });

    test('rejects unauthenticated request to /api/auth/me', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });
  });
});