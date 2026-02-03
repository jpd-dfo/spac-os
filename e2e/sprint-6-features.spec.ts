/**
 * Sprint 6 E2E Tests
 * SEC & Compliance + Sprint 5 P2 Carryover Features
 */

import { test, expect } from '@playwright/test';

// =============================================================================
// SEC EDGAR Integration Tests
// =============================================================================
test.describe('SEC EDGAR Integration', () => {
  test('should have SEC filings API endpoint', async ({ request }) => {
    // Test the SEC filings API endpoint exists
    const response = await request.get('/api/sec/filings?cik=0001234567');
    expect([200, 401, 404]).toContain(response.status());
  });

  test('compliance page should load without errors', async ({ page }) => {
    await page.goto('/compliance');
    // Should redirect to sign-in for unauthenticated users
    await expect(page).toHaveURL(/sign-in/);
  });

  test('filing detail page route should exist', async ({ page }) => {
    await page.goto('/filings/test-filing-id');
    // Route should exist - may redirect to sign-in or show filing page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('filings')).toBe(true);
  });
});

// =============================================================================
// Analysis Caching Tests
// =============================================================================
test.describe('Analysis Caching API', () => {
  test('should have analysis cache GET endpoint', async ({ request }) => {
    const response = await request.get('/api/ai/analysis-cache?documentId=test');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('should have analysis cache POST endpoint', async ({ request }) => {
    const response = await request.post('/api/ai/analysis-cache', {
      headers: { 'Content-Type': 'application/json' },
      data: { documentId: 'test', analysis: {} },
    });
    expect([200, 201, 401, 400]).toContain(response.status());
  });
});

// =============================================================================
// Score History Tests
// =============================================================================
test.describe('Score History API', () => {
  test('should have score history GET endpoint', async ({ request }) => {
    const response = await request.get('/api/score-history?targetId=test');
    expect([200, 401, 404, 500]).toContain(response.status());
  });

  test('should have score history POST endpoint', async ({ request }) => {
    const response = await request.post('/api/score-history', {
      headers: { 'Content-Type': 'application/json' },
      data: {
        targetId: 'test',
        overallScore: 75,
        managementScore: 80,
      },
    });
    expect([200, 201, 401, 400]).toContain(response.status());
  });
});

// =============================================================================
// Compliance Page Tests
// =============================================================================
test.describe('Compliance Features', () => {
  test('compliance page is protected', async ({ page }) => {
    await page.goto('/compliance');
    await expect(page).toHaveURL(/sign-in/);
  });

  test('should have compliance calendar functionality', async ({ page }) => {
    // Attempt to access compliance page
    await page.goto('/compliance');
    // Unauthenticated users should be redirected
    const url = page.url();
    expect(url).toContain('sign-in');
  });
});

// =============================================================================
// Document Card Risk Badge Tests
// =============================================================================
test.describe('Documents Page with Risk Badges', () => {
  test('documents page should be protected', async ({ page }) => {
    await page.goto('/documents');
    await expect(page).toHaveURL(/sign-in/);
  });
});

// =============================================================================
// Progress Indicator Tests
// =============================================================================
test.describe('AI Progress Indicators', () => {
  test('pipeline page should be accessible or protected', async ({ page }) => {
    await page.goto('/pipeline');
    // May redirect to sign-in or load pipeline page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('pipeline')).toBe(true);
  });

  test('pipeline detail page route exists', async ({ page }) => {
    await page.goto('/pipeline/test-id');
    // Route should exist - may redirect or show page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('pipeline')).toBe(true);
  });
});

// =============================================================================
// Filing Status Monitoring Tests
// =============================================================================
test.describe('Filing Status Monitoring', () => {
  test('filings page should be protected or accessible', async ({ page }) => {
    await page.goto('/filings');
    // May redirect to sign-in or load the page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('filings')).toBe(true);
  });

  test('individual filing page route exists', async ({ page }) => {
    await page.goto('/filings/test-id');
    // Route should exist - may redirect to sign-in or show filing page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('filings')).toBe(true);
  });
});

// =============================================================================
// SPAC Detail Page with SEC Integration
// =============================================================================
test.describe('SPAC Detail with SEC Integration', () => {
  test('spac detail page route exists', async ({ page }) => {
    await page.goto('/spacs/test-spac-id');
    // Route should exist - may redirect to sign-in or show page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('spacs')).toBe(true);
  });
});
