import request from 'supertest';
import { createApp } from '../../src/app.js';
import { User } from '../../src/models/User.js';
import { hashPassword } from '../../src/utils/password.js';
import { verifyToken } from '../../src/utils/jwt.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

process.env.JWT_SECRET = 'test-jwt-secret-key-for-fastrev';

describe('POST /api/auth/login', () => {
  let app;
  const userEmail = 'login.user@example.com';
  const plainPassword = 'validPassword123';

  beforeAll(async () => {
    await connectTestDb();
    app = createApp();
  });

  beforeEach(async () => {
    await clearTestDb();
    const passwordHash = await hashPassword(plainPassword);
    await User.create({ email: userEmail, passwordHash });
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('logs in successfully with valid credentials and returns safe user data and valid token', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: plainPassword });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(userEmail);
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('createdAt');
    expect(res.body.user.passwordHash).toBeUndefined();

    // Verify token payload
    const decoded = verifyToken(res.body.token);
    expect(decoded.email).toBe(userEmail);
    expect(decoded.userId).toBe(res.body.user.id);
  });

  test('normalizes email during login (case-insensitive and trimmed)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '  LOGIN.USER@EXAMPLE.COM  ', password: plainPassword });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(userEmail);
  });

  test('rejects incorrect password with generic 401 error', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: 'wrongPassword999' });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('rejects unknown email with identical generic 401 error (no enumeration)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nonexistent@example.com', password: plainPassword });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
    expect(res.body.error.message).toBe('Invalid email or password');
  });

  test('rejects missing email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ password: plainPassword });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects missing password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('rejects empty credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: '   ', password: plainPassword });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('handles empty or malformed request body', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .set('Content-Type', 'application/json')
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  test('never exposes passwordHash in login response', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: userEmail, password: plainPassword });

    const rawBody = JSON.stringify(res.body);
    expect(rawBody).not.toMatch(/passwordHash/i);
  });
});