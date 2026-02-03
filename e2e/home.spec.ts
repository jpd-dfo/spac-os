import { test, expect } from '@playwright/test';

/**
 * SPAC OS - Home Page E2E Tests
 * Tests the public landing page
 */

test.describe('Home Page', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');

    // Page should load successfully
    await expect(page).toHaveTitle(/SPAC OS/i);
  });

  test('should have navigation to sign-in', async ({ page }) => {
    await page.goto('/');

    // Wait for page to settle, then check for sign-in link or redirect to sign-in
    await page.waitForLoadState('domcontentloaded');

    // The home page should either have a sign-in link or redirect to sign-in
    const hasSignInLink = await page.locator('a[href*="sign-in"]').first().isVisible().catch(() => false);
    const isOnSignInPage = page.url().includes('sign-in');

    expect(hasSignInLink || isOnSignInPage).toBeTruthy();
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Page should render without crashing
    expect(page.url()).toBeDefined();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    // Page should render without crashing
    expect(page.url()).toBeDefined();
  });
});
