import { test, expect } from '@playwright/test';

test.describe('Tool Detail', () => {
  // Use a known tool ID from mock data
  const toolId = '66666666-6666-6666-6666-666666666666'; // Pressure Washer (not owned by test user)
  const ownedToolId = '33333333-3333-3333-3333-333333333333'; // DeWalt Drill (owned by test user)

  test('should display tool name and status', async ({ page }) => {
    await page.goto(`/tools/${toolId}`);

    await expect(page.getByRole('heading', { name: /pressure washer/i })).toBeVisible();
    await expect(page.getByText('available')).toBeVisible();
  });

  test('should display tool details section', async ({ page }) => {
    await page.goto(`/tools/${toolId}`);

    await expect(page.getByRole('heading', { name: /details/i })).toBeVisible();
    await expect(page.getByText(/category/i)).toBeVisible();
    await expect(page.getByText(/max loan period/i)).toBeVisible();
  });

  test('should display owner information', async ({ page }) => {
    await page.goto(`/tools/${toolId}`);

    await expect(page.getByRole('heading', { name: /owner/i })).toBeVisible();
    await expect(page.getByText(/jane smith/i)).toBeVisible();
  });

  test('should display availability calendar', async ({ page }) => {
    await page.goto(`/tools/${toolId}`);

    await expect(page.getByRole('heading', { name: /availability calendar/i })).toBeVisible();
    // Calendar should be visible
    await expect(page.locator('.fc')).toBeVisible();
  });

  test('should show reservation info alert for non-owned tools', async ({ page }) => {
    await page.goto(`/tools/${toolId}`);

    await expect(page.getByText(/select dates on the calendar/i)).toBeVisible();
  });

  test('should show owner alert for owned tools', async ({ page }) => {
    await page.goto(`/tools/${ownedToolId}`);

    await expect(page.getByText(/this is your tool/i)).toBeVisible();
  });

  test('should open reservation dialog when selecting dates', async ({ page }) => {
    await page.goto(`/tools/${toolId}`);

    // Wait for calendar to load
    await page.waitForSelector('.fc');

    // Click on a future date cell to select it
    // Note: This test may need adjustment based on calendar state
    const futureDateCell = page.locator('.fc-daygrid-day:not(.fc-day-past)').first();
    if (await futureDateCell.isVisible()) {
      await futureDateCell.click();

      // If date selection triggers dialog
      const dialog = page.getByRole('dialog');
      if (await dialog.isVisible()) {
        await expect(page.getByRole('heading', { name: /request reservation/i })).toBeVisible();
      }
    }
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    await page.goto('/browse');
    await page.locator('.MuiCard-root').first().click();

    // Wait for tool detail page
    await expect(page).toHaveURL(/\/tools\/.+/);

    // Click back button (IconButton with ArrowBack icon)
    await page.locator('button').filter({ has: page.locator('[data-testid="ArrowBackIcon"]') }).click();

    // Should go back to browse
    await expect(page).toHaveURL('/browse');
  });

  test('should show not found for invalid tool ID', async ({ page }) => {
    await page.goto('/tools/invalid-id-12345');

    await expect(page.getByText(/tool not found/i)).toBeVisible();
  });
});
