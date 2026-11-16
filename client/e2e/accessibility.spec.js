import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {
  mockAuthenticated,
  mockUnauthenticated,
  mockDecksList,
  mockEmptyDecks,
  mockDeckDetail,
  setAuthToken,
} from './fixtures.js';

const TEST_DECK_ID = '507f1f77bcf86cd799439012';

async function expectNoAxeViolations(page) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();

  if (results.violations.length > 0) {
    const details = results.violations
      .map((violation) => {
        const nodes = violation.nodes
          .map((node) => `    - ${node.target.join(' ')}\n      ${node.failureSummary}`)
          .join('\n');
        return `${violation.id}: ${violation.description} (${violation.helpUrl})\n${nodes}`;
      })
      .join('\n\n');
    throw new Error(`Accessibility violations found:\n${details}`);
  }

  expect(results.violations).toHaveLength(0);
}

test.describe('Accessibility', () => {
  test('landing page has no axe violations', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('login page has no axe violations', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('registration page has no axe violations', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/register');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('dashboard empty state has no axe violations', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockEmptyDecks(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('dashboard populated state has no axe violations', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockDecksList(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('generate page has no axe violations', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await page.goto('/generate');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('deck detail page has no axe violations', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });

  test('study workflow with revealed answer has no axe violations', async ({ page }) => {
    await setAuthToken(page);
    await mockAuthenticated(page);
    await mockDeckDetail(page, TEST_DECK_ID);
    await page.goto(`/decks/${TEST_DECK_ID}`);
    await page.waitForLoadState('networkidle');
    await page.click('button:has-text("Reveal answer")');
    await expectNoAxeViolations(page);
  });

  test('not found page has no axe violations', async ({ page }) => {
    await mockUnauthenticated(page);
    await page.goto('/this-route-does-not-exist');
    await page.waitForLoadState('networkidle');
    await expectNoAxeViolations(page);
  });
});