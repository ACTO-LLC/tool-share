import { test, expect } from '@playwright/test';

/**
 * Combined E2E tests for verifying features from:
 * - Issue #21: My Reservations Page with status filtering
 * - Issue #31: Advanced Search & Filters
 * - Issue #57: Barcode lookup fix (non-standard lengths)
 */

test.describe('Issue #21: My Reservations - Status Filtering', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reservations');
    // Wait for page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display reservations page heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /reservations/i })).toBeVisible();
  });

  test('should display Borrowing and Lending tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /borrowing/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /lending/i })).toBeVisible();
  });

  test('should display status filter chips on reservations page', async ({ page }) => {
    // Status filter chips should be visible (All, Pending, Confirmed, etc.)
    // They are MUI Chips in a Stack
    const chipsContainer = page.locator('.MuiStack-root').filter({ has: page.locator('.MuiChip-root') });
    await expect(chipsContainer).toBeVisible();

    // Should have multiple filter chips
    const chips = chipsContainer.locator('.MuiChip-root');
    const chipCount = await chips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });

  test('should allow clicking status filter chips', async ({ page }) => {
    // Find any chip and click it
    const chips = page.locator('.MuiChip-root');
    const firstChip = chips.first();

    if (await firstChip.isVisible()) {
      await firstChip.click();
      // Chip should still be visible after click
      await expect(firstChip).toBeVisible();
    }
  });

  test('should switch between Borrowing and Lending tabs', async ({ page }) => {
    // Click Lending tab
    await page.getByRole('tab', { name: /lending/i }).click();

    // Lending tab should be selected
    const lendingTab = page.getByRole('tab', { name: /lending/i });
    await expect(lendingTab).toHaveAttribute('aria-selected', 'true');

    // Click back to Borrowing
    await page.getByRole('tab', { name: /borrowing/i }).click();
    const borrowingTab = page.getByRole('tab', { name: /borrowing/i });
    await expect(borrowingTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display reservation cards or empty state', async ({ page }) => {
    // Either show cards or empty state
    const cards = page.locator('.MuiCard-root');
    const emptyState = page.getByText(/no.*reservations|haven.*made any/i);

    const hasCards = await cards.first().isVisible().catch(() => false);
    const hasEmptyState = await emptyState.isVisible().catch(() => false);

    // One of them should be visible
    expect(hasCards || hasEmptyState).toBe(true);
  });
});

test.describe('Issue #31: Advanced Search & Filters', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');
  });

  test('should display browse tools page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /browse tools/i })).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search tools/i)).toBeVisible();
  });

  test('should display filter button', async ({ page }) => {
    // Filter button should be visible - could be icon button or text button
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));

    await expect(filterButton.first()).toBeVisible();
  });

  test('should open filter drawer when clicking filter', async ({ page }) => {
    // Click filter button
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));

    await filterButton.first().click();

    // Drawer should open with Filters heading
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible({ timeout: 10000 });
  });

  test('should show filter options in drawer', async ({ page }) => {
    // Open filter drawer
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));
    await filterButton.first().click();

    // Wait for filter drawer (not the nav drawer) - filter drawer has "Filters" heading
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible({ timeout: 10000 });

    // Should have Category, Circle, Sort options
    await expect(page.getByText('Category').first()).toBeVisible();
    await expect(page.getByText('Sort By').first()).toBeVisible();
  });

  test('should have date range filters', async ({ page }) => {
    // Open filter drawer
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));
    await filterButton.first().click();

    // Wait for filter drawer heading
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible({ timeout: 10000 });

    // Should have date range text
    await expect(page.getByText(/availability date range/i)).toBeVisible();
  });

  test('should have apply and clear buttons', async ({ page }) => {
    // Open filter drawer
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));
    await filterButton.first().click();

    // Wait for filter drawer heading
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible({ timeout: 10000 });

    // Should have Apply and Clear buttons
    await expect(page.getByRole('button', { name: /apply/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /clear/i })).toBeVisible();
  });

  test('should filter by category', async ({ page }) => {
    // Open filter drawer
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));
    await filterButton.first().click();

    // Wait for filter drawer heading
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible({ timeout: 10000 });

    // Click category dropdown in the drawer (the one after the Filters heading)
    const categorySelect = page.locator('.MuiFormControl-root').filter({ hasText: 'Category' }).locator('[role="combobox"]').last();
    await categorySelect.click();

    // Select Power Tools
    await page.getByRole('option', { name: 'Power Tools' }).click();

    // Apply filters
    await page.getByRole('button', { name: /apply/i }).click();

    // URL should update or filter chip should appear
    await page.waitForTimeout(500);
    const url = page.url();
    const hasFilterChip = await page.locator('.MuiChip-root').filter({ hasText: /power tools/i }).isVisible().catch(() => false);

    expect(url.includes('category') || hasFilterChip).toBe(true);
  });

  test('should search for tools', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search tools/i);
    await searchInput.fill('drill');

    // Wait for search to apply
    await page.waitForTimeout(500);

    // Check URL updated or results changed
    const url = page.url();
    expect(url.includes('q=drill') || url.includes('drill')).toBe(true);
  });

  test('should display view toggle buttons', async ({ page }) => {
    // Grid and List view buttons
    const toggleGroup = page.locator('[role="group"]').first();
    await expect(toggleGroup).toBeVisible();
  });
});

test.describe('Issue #57: Barcode Lookup - Non-Standard Lengths', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-tools/add');
    await page.waitForLoadState('networkidle');
  });

  test('should display add tool page', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /add.*tool/i })).toBeVisible();
  });

  test('should display UPC lookup field', async ({ page }) => {
    await expect(page.getByLabel(/upc.*barcode/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /lookup/i })).toBeVisible();
  });

  test('should accept 12-digit UPC-A barcode', async ({ page }) => {
    const upcField = page.getByLabel(/upc.*barcode/i);
    await upcField.fill('885909950713');
    await expect(upcField).toHaveValue('885909950713');
  });

  test('should accept 13-digit EAN barcode', async ({ page }) => {
    const upcField = page.getByLabel(/upc.*barcode/i);
    await upcField.fill('0885909950713');
    await expect(upcField).toHaveValue('0885909950713');
  });

  test('should accept 10-digit barcode (Issue #57 specific)', async ({ page }) => {
    // Issue #57 specifically mentions barcode 9317557847 (10 digits)
    const upcField = page.getByLabel(/upc.*barcode/i);
    await upcField.fill('9317557847');
    await expect(upcField).toHaveValue('9317557847');
  });

  test('should accept 8-digit barcode', async ({ page }) => {
    const upcField = page.getByLabel(/upc.*barcode/i);
    await upcField.fill('12345678');
    await expect(upcField).toHaveValue('12345678');
  });

  test('should attempt lookup without crashing for non-standard length', async ({ page }) => {
    const upcField = page.getByLabel(/upc.*barcode/i);
    await upcField.fill('9317557847');

    // Click lookup button
    await page.getByRole('button', { name: /lookup/i }).click();

    // Wait for lookup to complete (either success or not found)
    await page.waitForTimeout(3000);

    // Page should still be functional (not crashed)
    await expect(page.getByRole('heading', { name: /add.*tool/i })).toBeVisible();

    // Should show either product info or "not found" - not an error
    const hasError = await page.locator('.MuiAlert-standardError').filter({ hasText: /error|exception|failed/i }).isVisible().catch(() => false);
    expect(hasError).toBe(false);
  });

  test('should display required form fields', async ({ page }) => {
    await expect(page.getByLabel(/tool name/i)).toBeVisible();
    await expect(page.locator('.MuiFormControl-root').filter({ hasText: 'Category' })).toBeVisible();
  });

  test('should be able to fill form after barcode lookup', async ({ page }) => {
    // Try barcode lookup first
    const upcField = page.getByLabel(/upc.*barcode/i);
    await upcField.fill('885909950713');
    await page.getByRole('button', { name: /lookup/i }).click();
    await page.waitForTimeout(2000);

    // Should still be able to fill form fields
    const toolNameField = page.getByLabel(/tool name/i);
    await toolNameField.fill('Test Tool');
    await expect(toolNameField).toHaveValue('Test Tool');
  });
});

test.describe('Integration Tests - All Features', () => {
  test('can navigate between browse and reservations', async ({ page }) => {
    // Start at browse
    await page.goto('/browse');
    await expect(page.getByRole('heading', { name: /browse tools/i })).toBeVisible();

    // Navigate to reservations
    await page.goto('/reservations');
    await expect(page.getByRole('heading', { name: /reservations/i })).toBeVisible();
  });

  test('can access add tool page from navigation', async ({ page }) => {
    await page.goto('/my-tools/add');
    await expect(page.getByRole('heading', { name: /add.*tool/i })).toBeVisible();
  });

  test('filter drawer closes properly', async ({ page }) => {
    await page.goto('/browse');
    await page.waitForLoadState('networkidle');

    // Open filter drawer
    const filterButton = page.locator('button').filter({
      has: page.locator('[data-testid="FilterListIcon"]')
    }).or(page.getByRole('button', { name: /filter/i }));
    await filterButton.first().click();

    // Wait for filter drawer heading
    await expect(page.getByRole('heading', { name: /filters/i })).toBeVisible({ timeout: 10000 });

    // Close drawer via close button
    const closeButton = page.getByRole('button').filter({ has: page.locator('[data-testid="CloseIcon"]') });
    if (await closeButton.isVisible()) {
      await closeButton.click();
      // Filters heading should disappear
      await expect(page.getByRole('heading', { name: /filters/i })).not.toBeVisible({ timeout: 5000 });
    }
  });

  test('reservations page shows correct tab structure', async ({ page }) => {
    await page.goto('/reservations');

    // Should have tabs
    const tabs = page.getByRole('tablist');
    await expect(tabs).toBeVisible();

    // Borrowing tab selected by default
    const borrowingTab = page.getByRole('tab', { name: /borrowing/i });
    await expect(borrowingTab).toHaveAttribute('aria-selected', 'true');
  });
});
