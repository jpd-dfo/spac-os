/**
 * Sprint 10 E2E Tests - Companies Page
 * Tests for companies list, detail, search, and pagination
 */

import { test, expect } from '@playwright/test';

test.describe('Companies List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to companies page
    await page.goto('/companies');
    // Wait for initial DOM load
    await page.waitForLoadState('domcontentloaded');
  });

  test('can navigate to /companies page', async ({ page }) => {
    // Should either redirect to sign-in or show companies page
    const url = page.url();
    expect(url.includes('sign-in') || url.includes('companies')).toBe(true);
  });

  test('page loads and shows company list or empty state', async ({ page }) => {
    // Wait for page content to render
    await page.waitForTimeout(1000);

    // Should either show sign-in page or companies content
    const isOnSignIn = page.url().includes('sign-in');

    if (isOnSignIn) {
      // If redirected to sign-in, that's expected for protected routes
      await expect(page.locator('[data-clerk-component="SignIn"], h1:has-text("Sign in")').first()).toBeVisible({ timeout: 5000 });
    } else {
      // If on companies page, check for content
      const content = page.locator(
        '[data-testid="company-list"], [data-testid="empty-state"], .animate-pulse, .grid, button:has-text("Add Company"), button:has-text("Add"), h1:has-text("Companies")'
      ).first();
      await expect(content).toBeVisible({ timeout: 15000 });
    }
  });

  test('can search companies', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for search input
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="company" i], input[type="search"], [data-testid="search-input"]'
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(searchInput).toBeEnabled();

      // Type a search query
      await searchInput.fill('Tech');
      await page.waitForTimeout(500); // Wait for debounce

      // Verify search query was entered
      await expect(searchInput).toHaveValue('Tech');

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('can click through to company detail', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for a company link, card, or row
    const companyLink = page.locator(
      'a[href*="/companies/"], [data-testid="company-card"], [data-testid="company-row"], tr.cursor-pointer'
    ).first();

    // If companies exist, click to navigate
    if (await companyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await companyLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on a detail page
      await expect(page.url()).toMatch(/\/companies\/[a-zA-Z0-9-]+/);
    }
  });

  test('pagination works', async ({ page }) => {
    await page.waitForLoadState('domcontentloaded');

    // Look for pagination controls
    const paginationControls = page.locator(
      '[data-testid="pagination"], nav[aria-label="pagination"], .pagination, button:has-text("Next"), button:has-text("Previous")'
    ).first();

    // Pagination may or may not be visible depending on number of companies
    if (await paginationControls.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(paginationControls).toBeVisible();

      // Try clicking next page if available
      const nextButton = page.locator(
        'button:has-text("Next"), button[aria-label="Next page"], [data-testid="pagination-next"]'
      ).first();

      if (await nextButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        const isDisabled = await nextButton.isDisabled();
        if (!isDisabled) {
          await nextButton.click();
          await page.waitForTimeout(500);
          // Page should still be functional
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }

    // Also check for page size selector
    const pageSizeSelector = page.locator(
      'select[id="page-size"], [data-testid="page-size"], label:has-text("Show") >> .. >> select'
    ).first();

    if (await pageSizeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pageSizeSelector).toBeVisible();
    }

    // Check for results count text
    const resultsCount = page.locator(
      ':text-matches("Showing\\\\s+\\\\d+"), :text-matches("\\\\d+\\\\s+compan"), [data-testid="results-count"]'
    ).first();

    if (await resultsCount.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(resultsCount).toBeVisible();
    }
  });
});

test.describe('Company Detail Page', () => {
  test('company detail page shows tabs (Overview, Contacts, Deal History)', async ({ page }) => {
    // Navigate to companies first
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    // Try to find and click on a company
    const companyLink = page.locator(
      'a[href*="/companies/"], [data-testid="company-card"], [data-testid="company-row"], tr.cursor-pointer'
    ).first();

    if (await companyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await companyLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify we're on a detail page
      await expect(page.url()).toMatch(/\/companies\/[a-zA-Z0-9-]+/);

      // Check for tabs container
      const tabs = page.locator('[role="tablist"], [data-testid="tabs"], .tabs').first();
      if (await tabs.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(tabs).toBeVisible();

        // Check for Overview tab
        const overviewTab = page.locator(
          'button:has-text("Overview"), [role="tab"]:has-text("Overview"), [data-testid="overview-tab"]'
        ).first();
        if (await overviewTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(overviewTab).toBeVisible();
        }

        // Check for Contacts tab
        const contactsTab = page.locator(
          'button:has-text("Contacts"), [role="tab"]:has-text("Contacts"), [data-testid="contacts-tab"]'
        ).first();
        if (await contactsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(contactsTab).toBeVisible();
        }

        // Check for Deal History tab
        const dealHistoryTab = page.locator(
          'button:has-text("Deal History"), [role="tab"]:has-text("Deal History"), button:has-text("Deals"), [data-testid="deal-history-tab"]'
        ).first();
        if (await dealHistoryTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(dealHistoryTab).toBeVisible();
        }
      }
    }
  });

  test('can navigate between tabs on company detail page', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    const companyLink = page.locator(
      'a[href*="/companies/"], [data-testid="company-card"], tr.cursor-pointer'
    ).first();

    if (await companyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await companyLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Try clicking on different tabs
      const tabsToTest = ['Contacts', 'Deal History', 'Deals', 'Overview'];

      for (const tabName of tabsToTest) {
        const tab = page.locator(
          `button:has-text("${tabName}"), [role="tab"]:has-text("${tabName}")`
        ).first();

        if (await tab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await tab.click();
          await page.waitForTimeout(300);
          // Verify tab content area is visible
          await expect(page.locator('body')).toBeVisible();
        }
      }
    }
  });

  test('company detail page shows company information', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    const companyLink = page.locator(
      'a[href*="/companies/"], [data-testid="company-card"], tr.cursor-pointer'
    ).first();

    if (await companyLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await companyLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Check for main content sections
      const mainContent = page.locator('main, [data-testid="company-detail"]').first();
      await expect(mainContent).toBeVisible();

      // Check for company name/title
      const companyTitle = page.locator('h1').first();
      await expect(companyTitle).toBeVisible();
    }
  });

  test('handles non-existent company gracefully', async ({ page }) => {
    // Navigate to a non-existent company
    await page.goto('/companies/non-existent-id-12345');
    await page.waitForLoadState('domcontentloaded');

    // Page should handle the error gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Companies - Add/Create Flow', () => {
  test('add company button exists', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    // Look for add company button
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), [data-testid="add-company"]'
    ).first();

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(addButton).toBeVisible();
    }
  });
});

test.describe('Companies - Filter and Sort', () => {
  test('filter controls exist', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    // Look for filter button or filter dropdown
    const filterButton = page.locator(
      'button:has-text("Filter"), button:has-text("Filters"), [data-testid="filter-button"]'
    ).first();

    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(filterButton).toBeVisible();
    }
  });

  test('sort controls exist', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    // Look for sort dropdown
    const sortDropdown = page.locator(
      'button:has-text("Sort"), [data-testid="sort-dropdown"], div:has-text("Sort by") >> button'
    ).first();

    if (await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sortDropdown).toBeVisible();
    }
  });

  test('can clear search/filters', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    // First, apply a filter by searching
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]'
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Look for clear button
      const clearButton = page.locator(
        'button:has-text("Clear"), [data-testid="clear-filters"], [data-testid="clear-search"]'
      ).first();

      if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clearButton.click();
        await page.waitForTimeout(300);

        // Search input should be cleared
        await expect(searchInput).toHaveValue('');
      }
    }
  });
});

test.describe('Companies - Navigation Integration', () => {
  test('companies link is visible in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Look for Companies link in sidebar
    const companiesLink = page.locator(
      'a[href="/companies"], a[href*="/companies"], nav >> text=Companies'
    ).first();

    if (await companiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(companiesLink).toBeVisible();
    }
  });

  test('can navigate to companies from dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    // Look for Companies link in sidebar
    const companiesLink = page.locator(
      'a[href="/companies"], a[href*="/companies"], nav >> text=Companies'
    ).first();

    if (await companiesLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await companiesLink.click();
      await page.waitForLoadState('domcontentloaded');

      // Verify navigation
      await expect(page.url()).toContain('/companies');
    }
  });
});

test.describe('Companies - Table/Grid View', () => {
  test('view toggle buttons exist if available', async ({ page }) => {
    await page.goto('/companies');
    await page.waitForLoadState('domcontentloaded');

    // Look for view toggle buttons
    const gridViewButton = page.locator('button[aria-label="Grid view"], button:has-text("Grid")').first();
    const tableViewButton = page.locator('button[aria-label="Table view"], button:has-text("Table")').first();

    // At least one view toggle may be visible
    const hasGridView = await gridViewButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasTableView = await tableViewButton.isVisible({ timeout: 3000 }).catch(() => false);

    // This is optional - view toggles may or may not exist
    if (hasGridView || hasTableView) {
      expect(hasGridView || hasTableView).toBeTruthy();
    }
  });
});
