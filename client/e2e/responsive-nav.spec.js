import { test, expect } from '@playwright/test';

test.describe('Responsive Navigation', () => {
  test('mobile menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menuBtn = page.locator('button[aria-label="Open menu"]');
    await expect(menuBtn).toBeVisible();
    await menuBtn.click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
  });

  test('mobile menu closes after link click', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/');
    const menuBtn = page.locator('button[aria-label="Open menu"]');
    await menuBtn.click();
    await expect(page.locator('#mobile-nav')).toBeVisible();
    await page.locator('#mobile-nav a').first().click();
    await expect(page.locator('#mobile-nav')).not.toBeVisible();
  });

  test('desktop nav is visible on large screens', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.locator('nav.hidden')).toBeHidden(); // mobile nav hidden
    // Desktop nav should be visible
    const desktopNav = page.locator('nav').first();
    await expect(desktopNav).toBeVisible();
  });

  test('no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
    expect(overflow).toBe(false);
  });
});
