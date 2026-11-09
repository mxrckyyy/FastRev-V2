import { test, expect } from '@playwright/test';
import { mockAuthenticated, mockDeckDetail, mockDeckNotFound } from './fixtures.js';
import { MOCK_CARDS } from './fixtures.js';

const TEST_DECK_ID = '507f1f77bcf86cd799439012';

test.describe('Deck Detail', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthenticated(page);
  });

  test('shows loading state initially', async ({ page }) => {
    await page.route(`**/api/decks/${TEST_DECK_ID}`, async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ deck: { id: TEST_DECK_ID, title: 'Test Deck', cardCount: 2, createdAt: '2026-01-15T10:00:00.000Z', updatedAt: '2026-01-15T10:00:00.000Z' }, cards: MOCK_CARDS }),
      });
    });
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('[role="status"]')).toBeVisible();
  });

  test('renders deck title and cards', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('h1')).toContainText('Test Deck');
    await expect(page.locator('text=What is the powerhouse of the cell?')).toBeVisible();
  });

  test('shows empty state for deck with no cards', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID, []);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('text=No cards in this deck')).toBeVisible();
    await expect(page.locator('text=Generate cards')).toBeVisible();
  });

  test('shows error state for missing deck', async ({ page }) => {
    await mockDeckNotFound(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('text=Deck not found.')).toBeVisible();
    await expect(page.locator('button:has-text("Try again")')).toBeVisible();
  });

  test('reveals answer on button click', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('text=What is the powerhouse of the cell?')).toBeVisible();
    await page.click('button:has-text("Reveal answer")');
    await expect(page.locator('text=The mitochondria.')).toBeVisible();
    await expect(page.locator('button:has-text("Hide answer")')).toBeVisible();
  });

  test('navigates between cards', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('text=Card 1 of 2')).toBeVisible();
    await page.click('button:has-text("Next")');
    await expect(page.locator('text=Card 2 of 2')).toBeVisible();
    await expect(page.locator('text=What is DNA?')).toBeVisible();
  });

  test('previous button disabled on first card', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await expect(page.locator('button:has-text("Previous")')).toBeDisabled();
  });

  test('shows restart button on last card', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await page.click('button:has-text("Next")');
    await expect(page.locator('button:has-text("Restart")')).toBeVisible();
  });

  test('restarts deck on restart button click', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await page.click('button:has-text("Next")');
    await page.click('button:has-text("Restart")');
    await expect(page.locator('text=Card 1 of 2')).toBeVisible();
  });

  test('navigates back to dashboard', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.route('**/api/decks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: [] }) });
      }
    });
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await page.click('text=Dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('delete shows confirmation dialog', async ({ page }) => {
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.route('**/api/decks/*', (route) => {
      if (route.request().method() === 'DELETE') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ message: 'Deck and associated cards deleted successfully', deckId: TEST_DECK_ID }) });
      }
    });
    await page.route('**/api/decks', (route) => {
      if (route.request().method() === 'GET') {
        route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ decks: [] }) });
      }
    });
    await page.goto(`/decks/${TEST_DECK_ID}`);
    page.on('dialog', (dialog) => dialog.accept());
    await page.click('button:has-text("Delete deck")');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
