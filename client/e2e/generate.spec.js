import { test, expect } from '@playwright/test';
import { mockAuthenticated } from './fixtures.js';
import { MOCK_GENERATE_RESPONSE } from './fixtures.js';

test.describe('Generate Page', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page);
    await page.route('**/api/decks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: [] }) });
      }
    });
  });

  test('renders generation form', async ({ page }) => {
    await page.goto('/generate');
    await expect(page.locator('textarea')).toBeVisible();
    await expect(page.locator('button:has-text("Generate flashcards")')).toBeVisible();
    await expect(page.locator('text=Study material')).toBeVisible();
  });

  test('rejects empty input', async ({ page }) => {
    await page.goto('/generate');
    await expect(page.locator('button:has-text("Generate flashcards")')).toBeDisabled();
  });

  test('shows character counter', async ({ page }) => {
    await page.goto('/generate');
    await page.fill('textarea', 'Hello world');
    await expect(page.locator('text=11 / 20,000')).toBeVisible();
  });

  test('shows over-limit warning', async ({ page }) => {
    await page.goto('/generate');
    const longText = 'a'.repeat(20001);
    await page.fill('textarea', longText);
    await expect(page.locator('text=20,001 / 20,000')).toBeVisible();
  });

  test('submits valid input and navigates to deck', async ({ page }) => {
    await page.route('**/api/generate', (route) => {
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GENERATE_RESPONSE),
      });
    });
    await page.goto('/generate');
    await page.fill('textarea', 'Study material about photosynthesis');
    await page.click('button:has-text("Generate flashcards")');
    await expect(page).toHaveURL(/\/decks\/507f1f77bcf86cd799439016/);
  });

  test('shows loading state during generation', async ({ page }) => {
    await page.route('**/api/generate', async (route) => {
      await new Promise((r) => setTimeout(r, 1000));
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_GENERATE_RESPONSE),
      });
    });
    await page.goto('/generate');
    await page.fill('textarea', 'Study material');
    await page.click('button:has-text("Generate flashcards")');
    await expect(page.locator('text=Generating...')).toBeVisible();
  });

  test('shows error on API failure', async ({ page }) => {
    await page.route('**/api/generate', (route) => {
      route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ error: { code: 'PROVIDER_FAILED', message: 'All AI providers failed to generate flashcards.' } }),
      });
    });
    await page.goto('/generate');
    await page.fill('textarea', 'Study material');
    await page.click('button:has-text("Generate flashcards")');
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });
});
