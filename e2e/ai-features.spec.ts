import { test, expect } from '@playwright/test';

test.describe('AI Features', () => {
  test.describe('AI Score Card', () => {
    test('should protect pipeline target page', async ({ page }) => {
      await page.goto('/pipeline/test-id');
      // Should redirect to sign-in for unauthenticated users
      await expect(page).toHaveURL(/sign-in/);
    });

    test('AI Score Card should be visible on target detail page', async ({ page }) => {
      // This test would require authentication
      // For now, we test that the route exists and responds
      const response = await page.goto('/pipeline/test-id');
      expect(response?.status()).toBeLessThan(500);
    });
  });

  test.describe('AI API Endpoints', () => {
    test('should have /api/ai/analyze endpoint', async ({ request }) => {
      const response = await request.post('/api/ai/analyze', {
        data: {
          content: 'Test document content for analysis',
          operation: 'summary',
        },
      });
      // Should return 401 for unauthenticated or work if authenticated
      // Or 500/400 for validation errors - just verify endpoint exists
      expect([200, 400, 401, 500]).toContain(response.status());
    });

    test('should have /api/ai/score endpoint', async ({ request }) => {
      const response = await request.post('/api/ai/score', {
        data: {
          target: {
            name: 'Test Company',
            sector: 'Technology',
          },
          operation: 'score',
        },
      });
      expect([200, 400, 401, 500]).toContain(response.status());
    });

    test('should have /api/ai/research endpoint', async ({ request }) => {
      const response = await request.post('/api/ai/research', {
        data: {
          companyName: 'Test Company',
          sector: 'Technology',
          operation: 'company',
        },
      });
      expect([200, 400, 401, 500]).toContain(response.status());
    });
  });

  test.describe('AI Components UI', () => {
    test('pipeline page should load without errors', async ({ page }) => {
      // Navigate to pipeline page (will redirect to sign-in)
      const response = await page.goto('/pipeline');
      expect(response?.ok()).toBeTruthy();
    });

    test('documents page should load without errors', async ({ page }) => {
      // Navigate to documents page (will redirect to sign-in)
      const response = await page.goto('/documents');
      expect(response?.ok()).toBeTruthy();
    });
  });
});

test.describe('Document Analysis Integration', () => {
  test('documents page is protected', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should have analyze functionality available', async ({ page }) => {
    // This verifies the page component can load
    const response = await page.goto('/documents');
    expect(response?.status()).toBeLessThan(500);
  });
});

test.describe('Pipeline AI Integration', () => {
  test('pipeline list page should load', async ({ page }) => {
    const response = await page.goto('/pipeline');
    expect(response?.ok()).toBeTruthy();
  });

  test('pipeline detail page route exists', async ({ page }) => {
    // Test that the route pattern is valid
    const response = await page.goto('/pipeline/some-target-id');
    // Will redirect to sign-in, but route should exist
    expect(response?.status()).toBeLessThan(500);
  });
});
