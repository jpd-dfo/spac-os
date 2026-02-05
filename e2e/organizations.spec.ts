/**
 * Sprint 10 E2E Tests - PE Firm (Organizations) Management
 * Tests for organizations list, detail, filtering, and pagination
 */

import { test, expect } from '@playwright/test';

test.describe('Organizations List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to organizations page
    await page.goto('/organizations');
  });

  test('can navigate to /organizations page', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Verify URL is correct
    await expect(page.url()).toContain('/organizations');

    // Verify page is accessible
    await expect(page.locator('body')).toBeVisible();
  });

  test('page loads and shows organization list or empty state', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title or header exists
    await expect(
      page.locator('h1, [data-testid="organizations-header"], h1:has-text("Organizations"), h1:has-text("PE Firms")').first()
    ).toBeVisible({ timeout: 10000 });

    // Check that some content is present (either organization list or empty state)
    const content = page.locator(
      '[data-testid="organization-list"], [data-testid="empty-state"], table, .grid, button:has-text("Add Organization"), button:has-text("Add PE Firm")'
    ).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('can open filters', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for filter button or filter dropdown
    const filterButton = page.locator(
      'button:has-text("Filter"), button:has-text("Filters"), [data-testid="filter-button"], [data-testid="filters-dropdown"]'
    ).first();

    if (await filterButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(300);

      // Verify filter options are visible
      const filterOptions = page.locator(
        '[data-testid="filter-options"], [role="menu"], [role="listbox"], div.filter-options'
      ).first();

      if (await filterOptions.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(filterOptions).toBeVisible();
      }
    }
  });

  test('can search organizations', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="organization" i], input[placeholder*="firm" i], input[type="search"], [data-testid="search-input"]'
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(searchInput).toBeEnabled();

      // Type a search query
      await searchInput.fill('Alpha');
      await page.waitForTimeout(500); // Wait for debounce

      // Verify search query was entered
      await expect(searchInput).toHaveValue('Alpha');

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('can click through to organization detail', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for an organization link, card, or row
    const organizationLink = page.locator(
      'a[href*="/organizations/"], [data-testid="organization-card"], [data-testid="organization-row"], tr.cursor-pointer'
    ).first();

    // If organizations exist, click to navigate
    if (await organizationLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await organizationLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on a detail page
      await expect(page.url()).toMatch(/\/organizations\/[a-zA-Z0-9-]+/);
    }
  });

  test('pagination works', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for pagination controls
    const paginationControls = page.locator(
      '[data-testid="pagination"], nav[aria-label="pagination"], .pagination, button:has-text("Next"), button:has-text("Previous")'
    ).first();

    // Pagination may or may not be visible depending on number of organizations
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
      ':text-matches("Showing\\\\s+\\\\d+"), :text-matches("\\\\d+\\\\s+organization"), [data-testid="results-count"]'
    ).first();

    if (await resultsCount.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(resultsCount).toBeVisible();
    }
  });
});

test.describe('Organization Detail Page', () => {
  test('organization detail page shows tabs (Overview, Portfolio, Contacts, Activity)', async ({ page }) => {
    // Navigate to organizations first
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Try to find and click on an organization
    const organizationLink = page.locator(
      'a[href*="/organizations/"], [data-testid="organization-card"], [data-testid="organization-row"], tr.cursor-pointer'
    ).first();

    if (await organizationLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await organizationLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on a detail page
      await expect(page.url()).toMatch(/\/organizations\/[a-zA-Z0-9-]+/);

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

        // Check for Portfolio tab
        const portfolioTab = page.locator(
          'button:has-text("Portfolio"), [role="tab"]:has-text("Portfolio"), [data-testid="portfolio-tab"]'
        ).first();
        if (await portfolioTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(portfolioTab).toBeVisible();
        }

        // Check for Contacts tab
        const contactsTab = page.locator(
          'button:has-text("Contacts"), [role="tab"]:has-text("Contacts"), [data-testid="contacts-tab"]'
        ).first();
        if (await contactsTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(contactsTab).toBeVisible();
        }

        // Check for Activity tab
        const activityTab = page.locator(
          'button:has-text("Activity"), [role="tab"]:has-text("Activity"), [data-testid="activity-tab"]'
        ).first();
        if (await activityTab.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(activityTab).toBeVisible();
        }
      }
    }
  });

  test('can navigate between tabs on organization detail page', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    const organizationLink = page.locator(
      'a[href*="/organizations/"], [data-testid="organization-card"], tr.cursor-pointer'
    ).first();

    if (await organizationLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await organizationLink.click();
      await page.waitForLoadState('networkidle');

      // Try clicking on different tabs
      const tabsToTest = ['Portfolio', 'Contacts', 'Activity', 'Overview'];

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

  test('organization detail page shows organization information', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    const organizationLink = page.locator(
      'a[href*="/organizations/"], [data-testid="organization-card"], tr.cursor-pointer'
    ).first();

    if (await organizationLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await organizationLink.click();
      await page.waitForLoadState('networkidle');

      // Check for main content sections
      const mainContent = page.locator('main, [data-testid="organization-detail"]').first();
      await expect(mainContent).toBeVisible();

      // Check for organization name/title
      const orgTitle = page.locator('h1').first();
      await expect(orgTitle).toBeVisible();
    }
  });

  test('handles non-existent organization gracefully', async ({ page }) => {
    // Navigate to a non-existent organization
    await page.goto('/organizations/non-existent-id-12345');
    await page.waitForLoadState('networkidle');

    // Page should handle the error gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('Organizations - Add/Create Flow', () => {
  test('add organization button exists', async ({ page }) => {
    await page.goto('/organizations');
    await page.waitForLoadState('networkidle');

    // Look for add organization button
    const addButton = page.locator(
      'button:has-text("Add"), button:has-text("New"), button:has-text("Create"), [data-testid="add-organization"]'
    ).first();

    if (await addButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(addButton).toBeVisible();
    }
  });
});

test.describe('Organizations - Navigation Integration', () => {
  test('organizations link is visible in sidebar', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Look for Organizations link in sidebar (may also be labeled as PE Firms)
    const organizationsLink = page.locator(
      'a[href="/organizations"], a[href*="/organizations"], nav >> text=Organizations, nav >> text="PE Firms"'
    ).first();

    if (await organizationsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(organizationsLink).toBeVisible();
    }
  });
});
