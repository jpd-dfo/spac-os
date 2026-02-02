import { test, expect } from '@playwright/test';

/**
 * SPAC OS - Authentication E2E Tests
 * Tests the Clerk authentication flow
 */

test.describe('Authentication', () => {
  test('should redirect unauthenticated users to sign-in', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should display sign-in page correctly', async ({ page }) => {
    await page.goto('/sign-in');

    // Check for Clerk sign-in component or SPAC OS branding
    await expect(page.locator('text=Sign in')).toBeVisible();
  });

  test('should display sign-up page correctly', async ({ page }) => {
    await page.goto('/sign-up');

    // Check for Clerk sign-up component
    await expect(page.locator('text=Sign up')).toBeVisible();
  });

  test('should have Google OAuth option on sign-in', async ({ page }) => {
    await page.goto('/sign-in');

    // Look for Google sign-in button (Clerk provides this)
    // The exact selector may vary based on Clerk's UI
    const googleButton = page.locator('button:has-text("Google"), [data-provider="google"]');
    await expect(googleButton).toBeVisible();
  });
});

test.describe('Protected Routes', () => {
  test('should protect /dashboard route', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).not.toHaveURL('/dashboard');
  });

  test('should protect /spacs route', async ({ page }) => {
    await page.goto('/spacs');
    await expect(page).not.toHaveURL('/spacs');
  });

  test('should protect /pipeline route', async ({ page }) => {
    await page.goto('/pipeline');
    await expect(page).not.toHaveURL('/pipeline');
  });

  test('should protect /documents route', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).not.toHaveURL('/documents');
  });

  test('should protect /compliance route', async ({ page }) => {
    await page.goto('/compliance');
    await expect(page).not.toHaveURL('/compliance');
  });
});
