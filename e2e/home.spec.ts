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

    // Look for sign-in link or button
    const signInLink = page.locator('a[href*="sign-in"], button:has-text("Sign in"), a:has-text("Sign in")');
    await expect(signInLink.first()).toBeVisible();
  });

  test('should be responsive', async ({ page }) => {
    // Test desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
  });
});
