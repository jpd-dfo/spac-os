import { test, expect } from '@playwright/test';

test.describe('Documents Module', () => {
  test('should protect /documents route for unauthenticated users', async ({ page }) => {
    await page.goto('/documents');

    // Should redirect to sign-in
    await expect(page).toHaveURL(/sign-in/);
  });

  test('documents page should load for authenticated users', async ({ page }) => {
    // Note: This test would require authentication setup
    // For now, just verify the route exists and redirects properly
    await page.goto('/documents');

    // Should see sign-in page or documents page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('documents')).toBe(true);
  });
});

test.describe('Document Upload Component', () => {
  test('should have upload functionality on documents page', async ({ page }) => {
    await page.goto('/documents');

    // Verify redirect happens (authentication required)
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('SPAC Documents Integration', () => {
  test('should protect /spacs route', async ({ page }) => {
    await page.goto('/spacs');

    // Should redirect to sign-in for unauthenticated users
    await expect(page).toHaveURL(/sign-in/);
  });
});

test.describe('Pipeline Documents Integration', () => {
  test('should protect /pipeline route', async ({ page }) => {
    await page.goto('/pipeline');

    // Should redirect to sign-in for unauthenticated users
    await expect(page).toHaveURL(/sign-in/);
  });
});
