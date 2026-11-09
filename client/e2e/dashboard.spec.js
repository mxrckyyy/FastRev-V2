import { test, expect } from '@playwright/test';
import { MOCK_DECKS, mockAuthenticated, mockDecksList, mockEmptyDecks } from './fixtures.js';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page);
  });

  test('shows loading state initially', async ({ page }) => {
    await page.route('**/api/decks', async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: [] }) });
    });
    await page.goto('/dashboard');
    await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('shows empty state when no decks', async ({ page }) => {
    await mockEmptyDecks(page);
    await page.goto('/dashboard');
    await expect(page.locator('text=No decks yet')).toBeVisible();
    await expect(page.locator('text=Create your first deck')).toBeVisible();
  });

  test('renders decks when API returns data', async ({ page }) => {
    await mockDecksList(page);
    await page.goto('/dashboard');
    await expect(page.locator('text=Biology 101')).toBeVisible();
    await expect(page.locator('text=Chemistry Basics')).toBeVisible();
    await expect(page.locator('text=3 cards')).toBeVisible();
    await expect(page.locator('text=5 cards')).toBeVisible();
  });

  test('shows error state on API failure', async ({ page }) => {
    await page.route('**/api/decks', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Failed to load decks.' } }) });
    });
    await page.goto('/dashboard');
    await expect(page.locator('text=Failed to load decks.')).toBeVisible();
    await expect(page.locator('button:has-text("Try again")')).toBeVisible();
  });

  test('retry button refetches decks', async ({ page }) => {
    let callCount = 0;
    await page.route('**/api/decks', (route) => {
      callCount++;
      if (callCount === 1) {
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Failed to load decks.' } }) });
      } else {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: MOCK_DECKS }) });
      }
    });
    await page.goto('/dashboard');
    await expect(page.locator('text=Failed to load decks.')).toBeVisible();
    await page.click('button:has-text("Try again")');
    await expect(page.locator('text=Biology 101')).toBeVisible();
  });

  test('delete button shows confirmation', async ({ page }) => {
    await mockDecksList(page);
    await page.route('**/api/decks/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deck and associated cards deleted successfully', deckId: '507f1f77bcf86cd799439012' }) });
      }
    });
    await page.goto('/dashboard');
    await expect(page.locator('text=Biology 101')).toBeVisible();

    // Set up dialog handler
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button[aria-label="Delete deck Biology 101"]');
    await expect(page.locator('text=Biology 101')).not.toBeVisible();
  });

  test('delete failure shows error', async ({ page }) => {
    await mockDecksList(page);
    await page.route('**/api/decks/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Failed to delete deck.' } }) });
      }
    });
    await page.goto('/dashboard');
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button[aria-label="Delete deck Biology 101"]');
    await expect(page.locator('[role="alert"]').first()).toBeVisible();
  });
});
