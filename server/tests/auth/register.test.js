import request from 'supertest';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

process.env.JWT_SECRET = 'test-jwt-secret-key-for-fastrev';

describe('POST /api/auth/register', () => {
  let app;

  beforeAll(async () => {
    await connectTestDb();
    app = createApp();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('registers a user successfully with 201 status and returns safe user data and token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.com', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toMatchObject({
      email: 'student@example.com',
    });
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('createdAt');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.body.user.password).toBeUndefined();

    // Verify database record
    const saved = await User.findOne({ email: 'student@example.com' });
    expect(saved).not.toBeNull();
    expect(saved.passwordHash).toBeDefined();
    expect(saved.passwordHash).not.toBe('password123');
    expect(saved.passwordHash.startsWith('$2')).toBe(true);
  });

  test('normalizes email by trimming and converting to lowercase', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '  STUDENT.Case@Example.COM  ', password: 'password123' });

    expect(res.status).toBe(201);
    expect(res.body.user.email).toBe('student.case@example.com');

    const saved = await User.findOne({ email: 'student.case@example.com' });
    expect(saved).not.toBeNull();
  });

  test('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects empty or whitespace-only email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: '   ', password: 'password123' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects invalid email formats', async () => {
    const invalidEmails = ['plainaddress', '@missingusername.com', 'user@.com', 'user@domain'];
    for (const email of invalidEmails) {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email, password: 'password123' });
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    }
  });

  test('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/at least 8 characters/);
  });

  test('rejects password exceeding 128 characters', async () => {
    const longPassword = 'p'.repeat(129);
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.com', password: longPassword });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/at most 128 characters/);
  });

  test('rejects non-string email or password', async () => {
    const res1 = await request(app)
      .post('/api/auth/register')
      .send({ email: 12345, password: 'password123' });
    expect(res1.status).toBe(400);

    const res2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'student@example.com', password: { secret: 'pass' } });
    expect(res2.status).toBe(400);
  });

  test('rejects duplicate email registration with 409 Conflict', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ email: 'dup@example.com', password: 'password123' });

    const duplicateRes = await request(app)
      .post('/api/auth/register')
      .send({ email: 'DUP@EXAMPLE.COM', password: 'anotherpassword' });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.error.code).toBe('CONFLICT');
    expect(duplicateRes.body.error.message).toMatch(/already registered/i);
  });

  test('ensures passwordHash is never exposed in response body under any condition', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'secure@example.com', password: 'password123' });

    const rawBody = JSON.stringify(res.body);
    expect(rawBody).not.toMatch(/passwordHash/i);
    expect(rawBody).not.toMatch(/password123/);
  });
});