import mongoose from 'mongoose';
import { User } from '../../src/models/User.js';
import { connectTestDb, clearTestDb, disconnectTestDb } from '../helpers/db.js';

describe('User model', () => {
  beforeAll(async () => {
    await connectTestDb();
  });

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await disconnectTestDb();
  });

  test('creates a valid user and normalizes email', async () => {
    const user = await User.create({
      email: '  Test@Example.COM  ',
      passwordHash: 'hashed-value',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.passwordHash).toBe('hashed-value');
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  test('rejects missing email', async () => {
    await expect(User.create({ passwordHash: 'hashed-value' })).rejects.toThrow();
  });

  test('rejects empty email', async () => {
    await expect(User.create({ email: '   ', passwordHash: 'hashed-value' })).rejects.toThrow();
  });

  test('rejects invalid email format', async () => {
    await expect(User.create({ email: 'not-an-email', passwordHash: 'hashed-value' })).rejects.toThrow();
  });

  test('rejects missing password hash', async () => {
    await expect(User.create({ email: 'user@example.com' })).rejects.toThrow();
  });

  test('rejects empty password hash', async () => {
    await expect(User.create({ email: 'user@example.com', passwordHash: '' })).rejects.toThrow();
  });

  test('rejects duplicate normalized emails via unique index', async () => {
    await User.create({ email: 'dup@example.com', passwordHash: 'hash-1' });
    let error;
    try {
      await User.create({ email: 'DUP@example.com', passwordHash: 'hash-2' });
    } catch (err) {
      error = err;
    }
    expect(error).toBeDefined();
    expect(error.code).toBe(11000);
  });

  test('unique email index exists', async () => {
    const indexes = await User.collection.indexes();
    const hasUniqueEmailIndex = indexes.some(
      (index) => index.unique === true && index.key && index.key.email === 1
    );
    expect(hasUniqueEmailIndex).toBe(true);
  });
});