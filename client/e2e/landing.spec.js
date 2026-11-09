import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('loads and displays hero content', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('h1')).toContainText('Make your notes');
    await expect(page.locator('text=Create your first deck')).toBeVisible();
    await expect(page.locator('text=Log in')).toBeVisible();
  });

  test('navigates to register via CTA', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Create your first deck');
    await expect(page).toHaveURL(/\/register/);
  });

  test('navigates to login via secondary CTA', async ({ page }) => {
    await page.goto('/');
    await page.click('text=Log in');
    await expect(page).toHaveURL(/\/login/);
  });

  test('mobile navigation works', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menuBtn = page.locator('button[aria-label="Open menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
  });
});
