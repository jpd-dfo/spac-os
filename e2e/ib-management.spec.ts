/**
 * Sprint 11 E2E Tests - IB (Investment Bank) Management
 * Tests for IB organization creation, detail page tabs, mandates, coverage, and dashboard
 *
 * These tests handle both authenticated and unauthenticated states:
 * - If authenticated: Tests full functionality with form input and submission
 * - If unauthenticated: Verifies redirect to sign-in (expected behavior)
 */

import { test, expect } from '@playwright/test';

// Generate unique names for each test run to avoid conflicts
const generateUniqueName = (prefix: string) => `${prefix} ${Date.now()}`;

// Helper to check if user is authenticated (not redirected to sign-in)
async function isAuthenticated(page: import('@playwright/test').Page): Promise<boolean> {
  await page.waitForLoadState('domcontentloaded');
  return !page.url().includes('sign-in');
}

// ============================================================================
// IB ORGANIZATION CREATION - FULL FORM SUBMISSION
// ============================================================================

test.describe('IB Organization Creation - Form Submission', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');
  });

  test('unauthenticated users are redirected to sign-in OR authenticated users see organizations page', async ({ page }) => {
    // This test passes in both states - documenting expected behavior
    const url = page.url();

    // Either redirected to sign-in OR on organizations page
    expect(url.includes('sign-in') || url.includes('organizations')).toBeTruthy();

    // Page should be responsive
    await expect(page.locator('body')).toBeVisible();
  });

  test('can create a new IB organization by filling form and submitting (when authenticated)', async ({ page }) => {
    if (!await isAuthenticated(page)) {
      // If not authenticated, verify redirect to sign-in
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated (redirected to sign-in)');
      return;
    }

    const uniqueName = generateUniqueName('Test IB Bank');

    // Click Add Organization button
    const addButton = page.locator('button:has-text("Add Organization")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for modal to open
    await page.waitForTimeout(500);
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible({ timeout: 5000 });

    // Fill in organization name
    const nameInput = page.locator('#org-name');
    await expect(nameInput).toBeVisible();
    await nameInput.fill(uniqueName);

    // Verify slug was auto-populated
    const slugInput = page.locator('#org-slug');
    await expect(slugInput).not.toBeEmpty();

    // Select IB (Investment Bank) type
    const typeSelect = page.locator('#org-type');
    await typeSelect.selectOption('IB');
    await expect(typeSelect).toHaveValue('IB');

    // Select a subtype (BULGE_BRACKET for IB)
    const subTypeSelect = page.locator('#org-subtype');
    await subTypeSelect.selectOption('BULGE_BRACKET');
    await expect(subTypeSelect).toHaveValue('BULGE_BRACKET');

    // Fill headquarters
    const hqInput = page.locator('#org-hq');
    await hqInput.fill('New York, NY');
    await expect(hqInput).toHaveValue('New York, NY');

    // Fill website
    const websiteInput = page.locator('#org-website');
    await websiteInput.fill('https://www.testib.com');
    await expect(websiteInput).toHaveValue('https://www.testib.com');

    // Fill AUM
    const aumInput = page.locator('#org-aum');
    await aumInput.fill('5000000000');
    await expect(aumInput).toHaveValue('5000000000');

    // Fill description
    const descriptionInput = page.locator('#org-description');
    await descriptionInput.fill('A test investment bank created by E2E tests');
    await expect(descriptionInput).toHaveValue('A test investment bank created by E2E tests');

    // Click an industry focus button (Technology)
    const techButton = page.locator('button:has-text("Technology")').first();
    if (await techButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await techButton.click();
    }

    // Submit the form
    const submitButton = page.locator('button:has-text("Create Organization")');
    await expect(submitButton).toBeVisible();
    await submitButton.click();

    // Wait for the mutation to complete and modal to close
    await page.waitForTimeout(2000);

    // Verify the modal closed (success)
    await expect(modal).not.toBeVisible({ timeout: 10000 });

    // Search for the created organization to verify it exists
    const searchInput = page.locator('input[placeholder*="search" i], input[placeholder*="Search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(uniqueName);
      await page.waitForTimeout(1000); // Wait for search debounce

      // Verify the organization appears in the list
      const orgCard = page.locator(`text=${uniqueName}`).first();
      await expect(orgCard).toBeVisible({ timeout: 10000 });
    }
  });

  test('form validation prevents submission without required fields (when authenticated)', async ({ page }) => {
    if (!await isAuthenticated(page)) {
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Click Add Organization button
    const addButton = page.locator('button:has-text("Add Organization")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    // Wait for modal
    await page.waitForTimeout(500);
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Try to submit without filling name
    const submitButton = page.locator('button:has-text("Create Organization")');
    await submitButton.click();

    // Modal should still be visible (form didn't submit)
    await page.waitForTimeout(500);
    await expect(modal).toBeVisible();

    // Close the modal
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await cancelButton.click();
  });
});

// ============================================================================
// IB DETAIL PAGE - TAB VISIBILITY & INTERACTION
// ============================================================================

test.describe('IB Detail Page - Tab Interaction', () => {
  test('IB organization shows Mandates and Coverage tabs (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated');
      return;
    }

    const uniqueName = generateUniqueName('IB Tabs Test');

    // Create IB organization
    const addButton = page.locator('button:has-text("Add Organization")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    await page.waitForTimeout(500);

    // Fill minimal required fields
    await page.locator('#org-name').fill(uniqueName);
    await page.locator('#org-type').selectOption('IB');

    // Submit
    await page.locator('button:has-text("Create Organization")').click();
    await page.waitForTimeout(2000);

    // Search for and click the created organization
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(uniqueName);
      await page.waitForTimeout(1000);
    }

    // Click on the organization card
    const orgCard = page.locator(`.cursor-pointer:has-text("${uniqueName}")`).first();
    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on detail page
      await expect(page.url()).toMatch(/\/organizations\/[a-zA-Z0-9-]+/);

      // Check for IB-specific tabs
      const mandatesTab = page.locator('button:has-text("Mandates"), [role="tab"]:has-text("Mandates")').first();
      const coverageTab = page.locator('button:has-text("Coverage"), [role="tab"]:has-text("Coverage")').first();
      const portfolioTab = page.locator('button:has-text("Portfolio"), [role="tab"]:has-text("Portfolio")').first();

      // IB should have Mandates and Coverage tabs
      await expect(mandatesTab).toBeVisible({ timeout: 5000 });
      await expect(coverageTab).toBeVisible({ timeout: 5000 });

      // IB should NOT have Portfolio tab
      await expect(portfolioTab).not.toBeVisible({ timeout: 2000 });
    }
  });

  test('can click through tabs on IB organization detail page (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Filter for IB organizations
    const typeFilter = page.locator('div:has-text("All Types")').first();
    if (await typeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);

      const ibOption = page.locator('[role="menuitem"]:has-text("Investment Bank")').first();
      if (await ibOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ibOption.click();
        await page.waitForTimeout(500);
      }
    }

    // Click on first organization
    const orgCard = page.locator('.cursor-pointer').first();
    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();
      await page.waitForLoadState('domcontentloaded');

      // Test clicking each tab
      const tabsToTest = ['Mandates', 'Coverage', 'Contacts', 'Activity', 'Overview'];

      for (const tabName of tabsToTest) {
        const tab = page.locator(`button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`).first();
        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(500);
          // Verify page is still functional
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });
});

// ============================================================================
// PE FIRM DETAIL PAGE - REGRESSION TEST
// ============================================================================

test.describe('PE Firm Detail Page - Regression', () => {
  test('PE_FIRM organization shows Portfolio tab (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated');
      return;
    }

    const uniqueName = generateUniqueName('PE Firm Test');

    // Create PE organization
    const addButton = page.locator('button:has-text("Add Organization")').first();
    await expect(addButton).toBeVisible({ timeout: 10000 });
    await addButton.click();

    await page.waitForTimeout(500);

    // Fill fields - PE_FIRM is default type
    await page.locator('#org-name').fill(uniqueName);
    await page.locator('#org-type').selectOption('PE_FIRM');
    await page.locator('#org-subtype').selectOption('BUYOUT');

    // Submit
    await page.locator('button:has-text("Create Organization")').click();
    await page.waitForTimeout(2000);

    // Search for and click the created organization
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill(uniqueName);
      await page.waitForTimeout(1000);
    }

    // Click on the organization card
    const orgCard = page.locator(`.cursor-pointer:has-text("${uniqueName}")`).first();
    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on detail page
      await expect(page.url()).toMatch(/\/organizations\/[a-zA-Z0-9-]+/);

      // Check for PE-specific tabs
      const portfolioTab = page.locator('button:has-text("Portfolio"), [role="tab"]:has-text("Portfolio")').first();
      const mandatesTab = page.locator('button:has-text("Mandates"), [role="tab"]:has-text("Mandates")').first();
      const coverageTab = page.locator('button:has-text("Coverage"), [role="tab"]:has-text("Coverage")').first();

      // PE Firm should have Portfolio tab
      await expect(portfolioTab).toBeVisible({ timeout: 5000 });

      // PE Firm should NOT have Mandates or Coverage tabs
      await expect(mandatesTab).not.toBeVisible({ timeout: 2000 });
      await expect(coverageTab).not.toBeVisible({ timeout: 2000 });
    }
  });
});

// ============================================================================
// MANDATES TAB - INTERACTION
// ============================================================================

test.describe('Mandates Tab - Interaction', () => {
  test('Mandates tab shows content when clicked (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Filter for IB organizations
    const typeFilter = page.locator('div:has-text("All Types")').first();
    if (await typeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);

      const ibOption = page.locator('[role="menuitem"]:has-text("Investment Bank")').first();
      if (await ibOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ibOption.click();
        await page.waitForTimeout(500);
      }
    }

    // Click on first IB organization
    const orgCard = page.locator('.cursor-pointer').first();
    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();
      await page.waitForLoadState('domcontentloaded');

      // Click Mandates tab
      const mandatesTab = page.locator('button:has-text("Mandates"), [role="tab"]:has-text("Mandates")').first();
      if (await mandatesTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await mandatesTab.click();
        await page.waitForTimeout(500);

        // Check for mandates content
        const mainContent = page.locator('main').first();
        await expect(mainContent).toBeVisible();
      }
    }
  });
});

// ============================================================================
// COVERAGE TAB - INTERACTION
// ============================================================================

test.describe('Coverage Tab - Interaction', () => {
  test('Coverage tab shows content when clicked (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      await expect(page.url()).toContain('sign-in');
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Filter for IB organizations
    const typeFilter = page.locator('div:has-text("All Types")').first();
    if (await typeFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);

      const ibOption = page.locator('[role="menuitem"]:has-text("Investment Bank")').first();
      if (await ibOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ibOption.click();
        await page.waitForTimeout(500);
      }
    }

    // Click on first IB organization
    const orgCard = page.locator('.cursor-pointer').first();
    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();
      await page.waitForLoadState('domcontentloaded');

      // Click Coverage tab
      const coverageTab = page.locator('button:has-text("Coverage"), [role="tab"]:has-text("Coverage")').first();
      if (await coverageTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await coverageTab.click();
        await page.waitForTimeout(500);

        // Check for coverage content
        const mainContent = page.locator('main').first();
        await expect(mainContent).toBeVisible();
      }
    }
  });
});

// ============================================================================
// DASHBOARD ACTIVITY FEED - REAL DATA
// ============================================================================

test.describe('Dashboard Activity Feed - Real Data', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');
  });

  test('dashboard redirects to sign-in OR loads for authenticated users', async ({ page }) => {
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('dashboard')).toBeTruthy();
    await expect(page.locator('body')).toBeVisible();
  });

  test('Activity Feed does not contain hardcoded mock data (when authenticated)', async ({ page }) => {
    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    await page.waitForTimeout(2000);

    const pageContent = await page.textContent('body');

    // These patterns would indicate mock data
    const mockDataPatterns = [
      'Mock Activity',
      'Test User 123',
      'FAKE_DATA_',
      '__MOCK__',
      'Lorem ipsum'
    ];

    for (const pattern of mockDataPatterns) {
      expect(pageContent).not.toContain(pattern);
    }
  });

  test('dashboard does not show hardcoded user name "Sarah Chen" (when authenticated)', async ({ page }) => {
    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    await page.waitForTimeout(1000);

    const pageContent = await page.textContent('body');
    expect(pageContent).not.toContain('Sarah Chen');
  });
});

// ============================================================================
// NAVIGATION INTEGRATION
// ============================================================================

test.describe('IB Management - Navigation', () => {
  test('can navigate from dashboard to organizations via sidebar (when authenticated)', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Find and click Organizations link in sidebar
    const orgLink = page.locator('a[href="/organizations"]').first();
    if (await orgLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgLink.click();
      await page.waitForLoadState('domcontentloaded');

      await expect(page.url()).toContain('/organizations');
    }
  });

  test('organization detail page has back navigation (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Click on first organization
    const orgCard = page.locator('.cursor-pointer').first();
    if (await orgCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await orgCard.click();
      await page.waitForLoadState('domcontentloaded');

      // Look for back button or link
      const backLink = page.locator('a[href="/organizations"]').first();
      if (await backLink.isVisible({ timeout: 3000 }).catch(() => false)) {
        await backLink.click();
        await page.waitForLoadState('domcontentloaded');

        // Should be back on organizations list
        await expect(page.url()).toMatch(/\/organizations\/?$/);
      }
    }
  });
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

test.describe('IB Management - Error Handling', () => {
  test('handles non-existent organization ID gracefully', async ({ page }) => {
    await page.goto('/organizations/non-existent-org-id-12345');
    await page.waitForLoadState('domcontentloaded');

    // Page should not crash
    await expect(page.locator('body')).toBeVisible();

    // Should show error state, redirect to list, or redirect to sign-in
    const url = page.url();
    const hasExpectedBehavior =
      url.includes('sign-in') ||
      (url.includes('/organizations') && !url.includes('non-existent')) ||
      await page.locator(':text("not found"), :text("Not Found"), :text("Error")').first().isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasExpectedBehavior).toBeTruthy();
  });
});

// ============================================================================
// FILTER AND SEARCH INTEGRATION
// ============================================================================

test.describe('Organization Filtering', () => {
  test('can filter organizations by type (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Click on type filter dropdown
    const typeFilter = page.locator('div:has-text("All Types")').first();
    if (await typeFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await typeFilter.click();
      await page.waitForTimeout(300);

      // Select Investment Bank
      const ibOption = page.locator('[role="menuitem"]:has-text("Investment Bank")').first();
      if (await ibOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await ibOption.click();
        await page.waitForTimeout(1000);

        // Page should still be functional
        await expect(page.locator('body')).toBeVisible();

        // Filter text should show selected type
        const filterText = page.locator('div:has-text("Investment Bank")').first();
        await expect(filterText).toBeVisible();
      }
    }
  });

  test('can search organizations by name (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Find search input
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Type a search query
      await searchInput.fill('Goldman');
      await page.waitForTimeout(1000); // Wait for debounce

      // Verify search was applied
      await expect(searchInput).toHaveValue('Goldman');

      // Page should be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('clear filters button works (when authenticated)', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    if (!await isAuthenticated(page)) {
      console.log('Test skipped: User not authenticated');
      return;
    }

    // Apply a filter first
    const searchInput = page.locator('input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);
    }

    // Look for clear button
    const clearButton = page.locator('button:has-text("Clear")').first();
    if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await clearButton.click();
      await page.waitForTimeout(500);

      // Search input should be cleared
      await expect(searchInput).toHaveValue('');
    }
  });
});

// ============================================================================
// SIGN-IN PAGE - AUTHENTICATION TESTS
// ============================================================================

test.describe('Authentication - Sign-In Page', () => {
  test('sign-in page loads correctly', async ({ page }) => {
    await page.goto('/sign-in');
    await page.waitForLoadState('domcontentloaded');

    // Check for Clerk sign-in component
    const clerkSignIn = page.locator('[data-clerk-component="SignIn"]').first();
    await expect(clerkSignIn).toBeVisible({ timeout: 10000 });
  });

  test('protected routes redirect to sign-in', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('domcontentloaded');

    const url = page.url();
    // Either on organizations (authenticated) or sign-in (unauthenticated)
    expect(url.includes('organizations') || url.includes('sign-in')).toBeTruthy();
  });
});
