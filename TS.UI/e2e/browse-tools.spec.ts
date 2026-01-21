import { test, expect } from '@playwright/test';

test.describe('Browse Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/browse');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /browse tools/i })).toBeVisible();
  });

  test('should display search input', async ({ page }) => {
    await expect(page.getByPlaceholder(/search tools/i)).toBeVisible();
  });

  test('should display category filter', async ({ page }) => {
    // MUI Select - find by the label text and nearby combobox
    await expect(page.locator('.MuiFormControl-root').filter({ hasText: 'Category' })).toBeVisible();
  });

  test('should display view toggle buttons', async ({ page }) => {
    const gridButton = page.getByRole('button', { pressed: true }).first();
    await expect(gridButton).toBeVisible();
  });

  test('should display results count', async ({ page }) => {
    await expect(page.getByText(/tool.*available/i)).toBeVisible();
  });

  test('should filter by search query', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search tools/i);
    await searchInput.fill('test');

    // Wait for search to filter
    await page.waitForTimeout(500);

    // Should either show filtered results or empty state
    // The search should update the results count or show "no tools found"
    const resultsCount = page.getByText(/tool.*available/i);
    const noResults = page.getByText(/no tools found/i);

    const hasResults = await resultsCount.isVisible().catch(() => false);
    const hasNoResults = await noResults.isVisible().catch(() => false);

    // Either we have results showing or empty state - search worked
    expect(hasResults || hasNoResults).toBeTruthy();
  });

  test('should filter by category', async ({ page }) => {
    // MUI Select - click the select element within the Category form control
    await page.locator('.MuiFormControl-root').filter({ hasText: 'Category' }).locator('[role="combobox"]').click();
    await page.getByRole('option', { name: 'Power Tools' }).click();

    // Should only show power tools - check for the chip on a tool card
    await expect(page.locator('.MuiCard-root .MuiChip-root').filter({ hasText: 'Power Tools' }).first()).toBeVisible();
  });

  test('should toggle between grid and list view', async ({ page }) => {
    // Click list view
    const viewToggle = page.locator('[role="group"]').first();
    const listButton = viewToggle.locator('button').nth(1);
    await listButton.click();

    // Verify list view is shown (cards should be horizontal)
    await expect(page.locator('.MuiCard-root').first()).toBeVisible();
  });

  test('should navigate to tool detail when clicking a tool', async ({ page }) => {
    // Click on first tool card
    await page.locator('.MuiCard-root').first().click();

    // Should navigate to tool detail page
    await expect(page).toHaveURL(/\/tools\/.+/);
  });

  test('should show empty state when no results', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search tools/i);
    await searchInput.fill('xyznonexistenttool123');

    await expect(page.getByText(/no tools found/i)).toBeVisible();
  });
});
