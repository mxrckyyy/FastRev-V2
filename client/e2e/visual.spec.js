import { test, expect } from '@playwright/test';
import {
  mockAuthenticated,
  mockUnauthenticated,
  mockDecksList,
  mockEmptyDecks,
  mockDeckDetail,
  setAuthToken,
} from './fixtures.js';

const TEST_DECK_ID = '507f1f77bcf86cd799439012';

async function stabilize(page) {
  await page.waitForLoadState('networkidle');
  // Wait for fonts to load with a timeout
  await page.evaluate(async () => {
    try {
      await Promise.race([
        document.fonts.ready,
        new Promise((resolve) => setTimeout(resolve, 10000)),
      ]);
    } catch {
      // Ignore font loading errors
    }
  });
  // Ensure Inter font is loaded and applied
  await page.evaluate(async () => {
    try {
      await document.fonts.load('400 1rem Inter');
      await document.fonts.load('500 1rem Inter');
      await document.fonts.load('600 1rem Inter');
      await document.fonts.load('700 1rem Inter');
    } catch {
      // Ignore font loading errors
    }
  });
  // Wait for font rendering to settle after loading
  await page.waitForTimeout(500);
}

const screenshotOptions = {
  animations: 'disabled',
  caret: 'hide',
  maxDiffPixelRatio: 0.02,
  threshold: 0.2,
};

test.describe('Visual Regression - Desktop', () => {
  test.use({ viewport: { width: 1280, height: 720 } });

  test('landing page', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');
    await stabilize(page);
    await expect(page).toHaveScreenshot('landing-desktop.png', screenshotOptions);
  });

  test('login page', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/login');
    await stabilize(page);
    await expect(page).toHaveScreenshot('login-desktop.png', screenshotOptions);
  });

  test('registration page', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/register');
    await stabilize(page);
    await expect(page).toHaveScreenshot('registration-desktop.png', screenshotOptions);
  });

  test('dashboard empty state', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockEmptyDecks(page);
    await page.goto('/dashboard');
    await stabilize(page);
    await expect(page).toHaveScreenshot('dashboard-empty-desktop.png', screenshotOptions);
  });

  test('dashboard with decks', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockDecksList(page);
    await page.goto('/dashboard');
    await stabilize(page);
    await expect(page).toHaveScreenshot('dashboard-decks-desktop.png', screenshotOptions);
  });

  test('generate page', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await page.goto('/generate');
    await stabilize(page);
    await expect(page).toHaveScreenshot('generate-desktop.png', screenshotOptions);
  });

  test('deck detail page', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await stabilize(page);
    await expect(page).toHaveScreenshot('deck-detail-desktop.png', screenshotOptions);
  });
});

test.describe('Visual Regression - Mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('landing page', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');
    await stabilize(page);
    await expect(page).toHaveScreenshot('landing-mobile.png', screenshotOptions);
  });

  test('login page', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/login');
    await stabilize(page);
    await expect(page).toHaveScreenshot('login-mobile.png', screenshotOptions);
  });

  test('dashboard empty state', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockEmptyDecks(page);
    await page.goto('/dashboard');
    await stabilize(page);
    await expect(page).toHaveScreenshot('dashboard-empty-mobile.png', screenshotOptions);
  });

  test('generate page', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await page.goto('/generate');
    await stabilize(page);
    await expect(page).toHaveScreenshot('generate-mobile.png', screenshotOptions);
  });

  test('deck detail page', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await stabilize(page);
    await expect(page).toHaveScreenshot('deck-detail-mobile.png', screenshotOptions);
  });
});