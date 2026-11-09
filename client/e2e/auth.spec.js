import { test, expect } from '@playwright/test';
import { mockUnauthenticated, mockAuthenticated } from './fixtures.js';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await mockUnauthenticated(page);
  });

  test('login form renders with required fields', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('login shows validation errors for empty fields', async ({ page }) => {
    await page.goto('/login');
    await page.click('button[type="submit"]');
    await expect(page.locator('.auth-field-error, .auth-error').first()).toBeVisible();
  });

  test('login shows error for invalid credentials', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'UNAUTHORIZED', message: 'Invalid email or password' } }),
      });
    });
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    await expect(page.locator('.auth-error')).toBeVisible();
    await expect(page.locator('.auth-error')).toContainText('Invalid email or password');
  });

  test('password visibility toggle works on login', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="password"]', 'testpass');
    const toggle = page.locator('button[aria-label="Show password"]');
    await expect(toggle).toBeVisible();
    await toggle.click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'text');
    await page.locator('button[aria-label="Hide password"]').click();
    await expect(page.locator('input[name="password"]')).toHaveAttribute('type', 'password');
  });

  test('register form renders with required fields', async ({ page }) => {
    await page.goto('/register');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('register shows validation for short password', async ({ page }) => {
    await page.goto('/register');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'short');
    await page.click('button[type="submit"]');
    await expect(page.locator('.auth-field-error').first()).toBeVisible();
  });

  test('register shows error for duplicate email', async ({ page }) => {
    await page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 409,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'CONFLICT', message: 'Email is already registered' } }),
      });
    });
    await page.goto('/register');
    await page.fill('input[type="email"]', 'existing@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page.locator('.auth-error')).toBeVisible();
    await expect(page.locator('.auth-error')).toContainText('already registered');
  });

  test('successful registration redirects to dashboard', async ({ page }) => {
    await page.route('**/api/auth/register', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '507f1f77bcf86cd799439011', email: 'new@example.com', createdAt: '2026-01-01T00:00:00.000Z' },
          token: 'test-token-123',
        }),
      });
    });
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: '507f1f77bcf86cd799439011', email: 'new@example.com', createdAt: '2026-01-01T00:00:00.000Z' } }),
      });
    });
    await page.route('**/api/decks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: [] }) });
      }
    });

    await page.goto('/register');
    await page.fill('input[type="email"]', 'new@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('successful login redirects to dashboard', async ({ page }) => {
    await page.route('**/api/auth/login', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '507f1f77bcf86cd799439011', email: 'test@example.com', createdAt: '2026-01-01T00:00:00.000Z' },
          token: 'test-token-123',
        }),
      });
    });
    await page.route('**/api/auth/me', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ user: { id: '507f1f77bcf86cd799439011', email: 'test@example.com', createdAt: '2026-01-01T00:00:00.000Z' } }),
      });
    });
    await page.route('**/api/decks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: [] }) });
      }
    });

    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('protected routes redirect to login when unauthenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/);
  });
});
