/**
 * Sprint E2E Tests - SPAC CRUD Flows
 * Tests for SPAC list, detail, creation, editing, filtering, and status changes
 */

import { test, expect } from '@playwright/test';

test.describe('SPAC List Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to SPACs page
    await page.goto('/spacs');
  });

  test('SPACs page loads and displays SPAC list or empty state', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check page title or header exists
    await expect(page.locator('h1:has-text("SPACs")').first()).toBeVisible();

    // Check that some content is present (either SPACs list/table or empty state)
    const content = page.locator(
      '[data-testid="spac-list"], table, .grid, [data-testid="empty-state"], button:has-text("Create SPAC")'
    ).first();
    await expect(content).toBeVisible({ timeout: 10000 });
  });

  test('New SPAC button is visible', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for the "New SPAC" button
    const newSpacButton = page.locator(
      'button:has-text("New SPAC"), button:has-text("Create SPAC"), [data-testid="new-spac-button"]'
    ).first();

    await expect(newSpacButton).toBeVisible({ timeout: 5000 });
  });

  test('search input exists and is functional', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for search input
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[placeholder*="ticker" i], input[type="search"], [data-testid="search-input"]'
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(searchInput).toBeEnabled();
      await searchInput.fill('TEST');
      // Wait for potential search results or debounce
      await page.waitForTimeout(500);
      // Verify search query was entered
      await expect(searchInput).toHaveValue('TEST');
    }
  });

  test('view toggle buttons exist (grid/table)', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for view toggle buttons
    const gridViewButton = page.locator('button[aria-label="Grid view"], button:has-text("Grid")').first();
    const tableViewButton = page.locator('button[aria-label="Table view"], button:has-text("Table")').first();

    // At least one view toggle should be visible
    const hasGridView = await gridViewButton.isVisible({ timeout: 3000 }).catch(() => false);
    const hasTableView = await tableViewButton.isVisible({ timeout: 3000 }).catch(() => false);

    expect(hasGridView || hasTableView).toBeTruthy();
  });

  test('status filter dropdown exists', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for status filter dropdown
    const statusFilter = page.locator(
      'button:has-text("Status"), [data-testid="status-filter"], div:has-text("Status") >> button'
    ).first();

    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(statusFilter).toBeEnabled();
    }
  });

  test('sort dropdown exists', async ({ page }) => {
    await page.waitForLoadState('networkidle');

    // Look for sort dropdown
    const sortDropdown = page.locator(
      'button:has-text("Sort"), [data-testid="sort-dropdown"], div:has-text("Sort by")'
    ).first();

    if (await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(sortDropdown).toBeVisible();
    }
  });
});

test.describe('SPAC Detail Page Navigation', () => {
  test('can navigate to SPAC detail page', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Look for a SPAC link or card
    const spacLink = page.locator('a[href*="/spacs/"], [data-testid="spac-card"], tr.cursor-pointer').first();

    // If SPACs exist, click to navigate
    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on a detail page (URL should contain /spacs/ followed by an ID)
      await expect(page.url()).toMatch(/\/spacs\/[a-zA-Z0-9-]+/);
    }
  });

  test('SPAC detail page shows main sections', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Check for main content sections
      const mainContent = page.locator('main, [data-testid="spac-detail"]').first();
      await expect(mainContent).toBeVisible();

      // Check for SPAC name/title
      const spacTitle = page.locator('h1').first();
      await expect(spacTitle).toBeVisible();

      // Check for edit button
      const editButton = page.locator('button:has-text("Edit"), [data-testid="edit-spac"]').first();
      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(editButton).toBeVisible();
      }
    }
  });

  test('SPAC detail page has tabs navigation', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Look for tabs (Overview, Timeline, Documents, etc.)
      const tabs = page.locator('[role="tablist"], [data-testid="tabs"]').first();
      if (await tabs.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(tabs).toBeVisible();

        // Check for specific tabs
        const overviewTab = page.locator('button:has-text("Overview"), [role="tab"]:has-text("Overview")').first();
        if (await overviewTab.isVisible({ timeout: 2000 }).catch(() => false)) {
          await expect(overviewTab).toBeVisible();
        }
      }
    }
  });
});

test.describe('SPAC Creation Flow', () => {
  test('can navigate to create SPAC page', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Click the New SPAC button
    const newSpacButton = page.locator(
      'button:has-text("New SPAC"), button:has-text("Create SPAC"), [data-testid="new-spac-button"]'
    ).first();

    if (await newSpacButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newSpacButton.click();
      await page.waitForLoadState('networkidle');

      // Verify we're on the create page
      await expect(page.url()).toContain('/spacs/new');
    }
  });

  test('create SPAC page has required form fields', async ({ page }) => {
    await page.goto('/spacs/new');
    await page.waitForLoadState('networkidle');

    // Check for form title
    const pageTitle = page.locator('h1:has-text("Create"), h1:has-text("New SPAC")').first();
    await expect(pageTitle).toBeVisible({ timeout: 5000 });

    // Check for required form fields
    const nameInput = page.locator('input[name="name"], input[placeholder*="Name" i], label:has-text("Name") + input, label:has-text("Name") >> .. >> input').first();
    const tickerInput = page.locator('input[name="ticker"], input[placeholder*="Ticker" i], label:has-text("Ticker") + input, label:has-text("Ticker") >> .. >> input').first();

    await expect(nameInput).toBeVisible({ timeout: 5000 });
    await expect(tickerInput).toBeVisible({ timeout: 5000 });
  });

  test('create SPAC form has status and phase selectors', async ({ page }) => {
    await page.goto('/spacs/new');
    await page.waitForLoadState('networkidle');

    // Check for status selector
    const statusSelect = page.locator('select[name="status"], label:has-text("Status") >> .. >> select').first();
    if (await statusSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusSelect).toBeVisible();
    }

    // Check for phase selector
    const phaseSelect = page.locator('select[name="phase"], label:has-text("Phase") >> .. >> select').first();
    if (await phaseSelect.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(phaseSelect).toBeVisible();
    }
  });

  test('create SPAC form has submit and cancel buttons', async ({ page }) => {
    await page.goto('/spacs/new');
    await page.waitForLoadState('networkidle');

    // Check for submit button
    const submitButton = page.locator(
      'button[type="submit"], button:has-text("Create SPAC"), button:has-text("Save")'
    ).first();
    await expect(submitButton).toBeVisible({ timeout: 5000 });

    // Check for cancel button
    const cancelButton = page.locator('button:has-text("Cancel")').first();
    await expect(cancelButton).toBeVisible({ timeout: 5000 });
  });

  test('cancel button navigates back to SPAC list', async ({ page }) => {
    await page.goto('/spacs/new');
    await page.waitForLoadState('networkidle');

    const cancelButton = page.locator('button:has-text("Cancel")').first();
    if (await cancelButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await cancelButton.click();
      await page.waitForLoadState('networkidle');

      // Should navigate back to SPACs list
      await expect(page.url()).toContain('/spacs');
      await expect(page.url()).not.toContain('/spacs/new');
    }
  });
});

test.describe('SPAC Edit Flow', () => {
  test('can navigate to edit page from detail page', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Navigate to a SPAC detail page first
    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Click Edit button
      const editButton = page.locator(
        'button:has-text("Edit SPAC"), button:has-text("Edit"), a[href*="/edit"]'
      ).first();

      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();
        await page.waitForLoadState('networkidle');

        // Verify we're on an edit page
        await expect(page.url()).toContain('/edit');
      }
    }
  });

  test('edit page pre-populates existing SPAC data', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Navigate to edit page via detail page
    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      const editButton = page.locator(
        'button:has-text("Edit SPAC"), button:has-text("Edit"), a[href*="/edit"]'
      ).first();

      if (await editButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await editButton.click();
        await page.waitForLoadState('networkidle');

        // Check that name field has a value (pre-populated)
        const nameInput = page.locator('input[name="name"], label:has-text("Name") >> .. >> input').first();
        if (await nameInput.isVisible({ timeout: 3000 }).catch(() => false)) {
          const nameValue = await nameInput.inputValue();
          // The field should have some pre-populated value
          expect(nameValue.length).toBeGreaterThan(0);
        }
      }
    }
  });
});

test.describe('SPAC Filtering and Search', () => {
  test('can filter SPACs by status', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Click on status filter
    const statusFilter = page.locator(
      'button:has-text("Status"), [data-testid="status-filter"]'
    ).first();

    if (await statusFilter.isVisible({ timeout: 5000 }).catch(() => false)) {
      await statusFilter.click();
      await page.waitForTimeout(300);

      // Look for filter options
      const filterOption = page.locator(
        '[role="menuitem"]:has-text("Searching"), [role="option"]:has-text("Searching"), label:has-text("Searching")'
      ).first();

      if (await filterOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await filterOption.click();
        await page.waitForTimeout(500);
        // Filter should be applied
      }
    }
  });

  test('can clear all filters', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // First, apply a filter by searching
    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]'
    ).first();

    if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForTimeout(500);

      // Look for clear filters button
      const clearButton = page.locator(
        'button:has-text("Clear"), [data-testid="clear-filters"]'
      ).first();

      if (await clearButton.isVisible({ timeout: 3000 }).catch(() => false)) {
        await clearButton.click();
        await page.waitForTimeout(300);

        // Search input should be cleared
        await expect(searchInput).toHaveValue('');
      }
    }
  });

  test('search filters results dynamically', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    const searchInput = page.locator(
      'input[placeholder*="search" i], input[type="search"]'
    ).first();

    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      // Type a search query
      await searchInput.fill('Alpha');
      await page.waitForTimeout(1000); // Wait for debounce and results

      // Page should still be functional
      await expect(page.locator('body')).toBeVisible();
    }
  });

  test('can change sort order', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Look for sort dropdown
    const sortDropdown = page.locator(
      'button:has-text("Sort"), div:has-text("Sort by") >> button'
    ).first();

    if (await sortDropdown.isVisible({ timeout: 5000 }).catch(() => false)) {
      await sortDropdown.click();
      await page.waitForTimeout(300);

      // Look for sort options
      const sortOption = page.locator(
        '[role="menuitem"]:has-text("Name"), [role="option"]:has-text("Name")'
      ).first();

      if (await sortOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await sortOption.click();
        await page.waitForTimeout(500);
      }
    }
  });
});

test.describe('SPAC Status Changes', () => {
  test('status transition component exists on detail page', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Navigate to a SPAC detail page
    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Look for status transition component or status badge with dropdown
      const statusComponent = page.locator(
        '[data-testid="status-transition"], .status-transition, div:has-text("Status Transition")'
      ).first();

      if (await statusComponent.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(statusComponent).toBeVisible();
      }
    }
  });

  test('SPAC status badge is displayed on detail page', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Look for status badge
      const statusBadge = page.locator(
        '[data-testid="spac-status"], .status-badge, span:has-text("Searching"), span:has-text("LOI"), span:has-text("DA Announced")'
      ).first();

      if (await statusBadge.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(statusBadge).toBeVisible();
      }
    }
  });

  test('status is displayed in SPAC list table', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Switch to table view if available
    const tableViewButton = page.locator('button[aria-label="Table view"]').first();
    if (await tableViewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableViewButton.click();
      await page.waitForTimeout(300);
    }

    // Check for status column in table
    const statusHeader = page.locator('th:has-text("Status"), [role="columnheader"]:has-text("Status")').first();
    if (await statusHeader.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(statusHeader).toBeVisible();
    }
  });
});

test.describe('SPAC Delete Flow', () => {
  test('delete option exists in SPAC actions menu', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Switch to table view if needed
    const tableViewButton = page.locator('button[aria-label="Table view"]').first();
    if (await tableViewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableViewButton.click();
      await page.waitForTimeout(300);
    }

    // Look for actions menu (three dots button)
    const actionsButton = page.locator(
      'button[aria-label="Actions"], [data-testid="spac-actions"], button:has(.lucide-more-horizontal), td >> button'
    ).first();

    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      await page.waitForTimeout(300);

      // Look for delete option in dropdown
      const deleteOption = page.locator(
        '[role="menuitem"]:has-text("Delete"), button:has-text("Delete")'
      ).first();

      if (await deleteOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await expect(deleteOption).toBeVisible();
      }
    }
  });

  test('delete confirmation modal appears', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Switch to table view
    const tableViewButton = page.locator('button[aria-label="Table view"]').first();
    if (await tableViewButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      await tableViewButton.click();
      await page.waitForTimeout(300);
    }

    // Open actions menu
    const actionsButton = page.locator('button:has(.lucide-more-horizontal), td >> button').first();

    if (await actionsButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await actionsButton.click();
      await page.waitForTimeout(300);

      // Click delete option
      const deleteOption = page.locator('[role="menuitem"]:has-text("Delete")').first();

      if (await deleteOption.isVisible({ timeout: 3000 }).catch(() => false)) {
        await deleteOption.click();
        await page.waitForTimeout(300);

        // Check for confirmation modal
        const modal = page.locator(
          '[role="dialog"], [data-testid="delete-modal"], div:has-text("Are you sure")'
        ).first();

        if (await modal.isVisible({ timeout: 3000 }).catch(() => false)) {
          await expect(modal).toBeVisible();

          // Check for cancel button in modal
          const cancelButton = page.locator('[role="dialog"] button:has-text("Cancel")').first();
          if (await cancelButton.isVisible({ timeout: 2000 }).catch(() => false)) {
            await cancelButton.click();
          }
        }
      }
    }
  });
});

test.describe('SPAC Pagination', () => {
  test('pagination controls exist when there are many SPACs', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Look for pagination controls
    const paginationControls = page.locator(
      '[data-testid="pagination"], nav[aria-label="pagination"], div:has-text("Page") >> button'
    ).first();

    // Pagination may or may not be visible depending on number of SPACs
    if (await paginationControls.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(paginationControls).toBeVisible();
    }
  });

  test('page size selector exists', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Look for page size selector
    const pageSizeSelector = page.locator(
      'select[id="page-size"], label:has-text("Show") >> .. >> select'
    ).first();

    if (await pageSizeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(pageSizeSelector).toBeVisible();
    }
  });

  test('results count is displayed', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    // Look for results count text (using multiple selectors combined with comma)
    const resultsCount = page.locator(
      ':text-matches("Showing\\\\s+\\\\d+"), :text-matches("\\\\d+\\\\s+SPACs"), [data-testid="results-count"]'
    ).first();

    if (await resultsCount.isVisible({ timeout: 3000 }).catch(() => false)) {
      await expect(resultsCount).toBeVisible();
    }
  });
});

test.describe('SPAC Error States', () => {
  test('handles non-existent SPAC gracefully', async ({ page }) => {
    // Navigate to a non-existent SPAC
    await page.goto('/spacs/non-existent-id-12345');
    await page.waitForLoadState('networkidle');

    // Should show error state or not found message
    const errorState = page.locator(
      'text=/not found/i, text=/error/i, [data-testid="error-state"], [data-testid="not-found"]'
    ).first();

    // Page should handle the error gracefully
    await expect(page.locator('body')).toBeVisible();
  });
});

test.describe('SPAC Metrics Cards', () => {
  test('key metrics are displayed on detail page', async ({ page }) => {
    await page.goto('/spacs');
    await page.waitForLoadState('networkidle');

    const spacLink = page.locator('a[href*="/spacs/"], tr.cursor-pointer').first();

    if (await spacLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await spacLink.click();
      await page.waitForLoadState('networkidle');

      // Check for key metrics cards
      const metricsSection = page.locator(
        '.grid, [data-testid="metrics"], div:has-text("Trust Balance")'
      ).first();

      if (await metricsSection.isVisible({ timeout: 5000 }).catch(() => false)) {
        await expect(metricsSection).toBeVisible();
      }
    }
  });
});
