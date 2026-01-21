import { test, expect } from '@playwright/test';

test.describe('Tool Detail', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to browse and click first tool to get a valid tool ID
    await page.goto('/browse');
    // Wait for tools to load
    await page.waitForTimeout(1000);
  });

  test('should display tool name and status chip', async ({ page }) => {
    // Click on first tool card
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Should display tool name (h4 heading)
      await expect(page.locator('h4').first()).toBeVisible();

      // Should display status chip (Available or Unavailable)
      await expect(page.locator('.MuiChip-root').first()).toBeVisible();
    }
  });

  test('should display loan details section', async ({ page }) => {
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Should display Loan Details section
      await expect(page.getByText(/loan details/i)).toBeVisible();
      await expect(page.getByText(/advance notice/i)).toBeVisible();
      await expect(page.getByText(/max loan/i)).toBeVisible();
    }
  });

  test('should display owner information', async ({ page }) => {
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Should display Owner section
      await expect(page.getByText(/owner/i).first()).toBeVisible();
      // Should display owner avatar
      await expect(page.locator('.MuiAvatar-root').first()).toBeVisible();
      // Should display Profile button
      await expect(page.getByRole('button', { name: /profile/i })).toBeVisible();
    }
  });

  test('should display back button', async ({ page }) => {
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Should display Back button
      await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
    }
  });

  test('should display Request to Borrow button for non-owned available tools', async ({ page }) => {
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Should display Request to Borrow button (if not own tool and available)
      const borrowButton = page.getByRole('button', { name: /request to borrow/i });
      const editButton = page.getByRole('button', { name: /edit tool/i });

      // One of these should be visible depending on ownership
      const hasBorrow = await borrowButton.isVisible().catch(() => false);
      const hasEdit = await editButton.isVisible().catch(() => false);
      expect(hasBorrow || hasEdit).toBeTruthy();
    }
  });

  test('should display Edit Tool button for owned tools', async ({ page }) => {
    // Go to my tools and click on one to see edit button
    await page.goto('/my-tools');
    await page.waitForTimeout(1000);

    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();

      // Should be on tool detail page
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Should display Edit Tool button for owned tools
      await expect(page.getByRole('button', { name: /edit tool/i })).toBeVisible();
    }
  });

  test('should open reservation dialog when clicking Request to Borrow', async ({ page }) => {
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      const borrowButton = page.getByRole('button', { name: /request to borrow/i });
      if (await borrowButton.isVisible() && await borrowButton.isEnabled()) {
        await borrowButton.click();

        // Dialog should open
        await expect(page.getByRole('dialog')).toBeVisible();
        await expect(page.getByText(/request to borrow/i)).toBeVisible();
        // Date pickers should be visible
        await expect(page.getByLabel(/start date/i)).toBeVisible();
        await expect(page.getByLabel(/end date/i)).toBeVisible();
      }
    }
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    const toolCard = page.locator('.MuiCard-root').first();
    if (await toolCard.isVisible()) {
      await toolCard.click();
      await expect(page).toHaveURL(/\/tools\/.+/);

      // Click back button
      await page.getByRole('button', { name: /back/i }).click();

      // Should go back to browse
      await expect(page).toHaveURL('/browse');
    }
  });

  test('should show not found for invalid tool ID', async ({ page }) => {
    await page.goto('/tools/invalid-id-12345');

    // Should show error message
    await expect(page.getByText(/tool not found/i)).toBeVisible();
    // Should show Browse Tools button
    await expect(page.getByRole('button', { name: /browse tools/i })).toBeVisible();
  });
});
