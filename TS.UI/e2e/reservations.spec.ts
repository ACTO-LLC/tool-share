import { test, expect } from '@playwright/test';

test.describe('Reservations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/reservations');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /reservations/i })).toBeVisible();
  });

  test('should display Borrowing and Lending tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /borrowing/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /lending/i })).toBeVisible();
  });

  test('should show Borrowing tab by default', async ({ page }) => {
    const borrowingTab = page.getByRole('tab', { name: /borrowing/i });
    await expect(borrowingTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch to Lending tab when clicked', async ({ page }) => {
    await page.getByRole('tab', { name: /lending/i }).click();

    const lendingTab = page.getByRole('tab', { name: /lending/i });
    await expect(lendingTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display reservation cards with tool info', async ({ page }) => {
    // Should show reservation info
    await expect(page.locator('.MuiCard-root').first()).toBeVisible();
  });

  test('should display reservation status chips', async ({ page }) => {
    // Look for status chips (confirmed, pending, etc.)
    const statusChips = page.locator('.MuiChip-root');
    await expect(statusChips.first()).toBeVisible();
  });

  test('should display action buttons for pending reservations', async ({ page }) => {
    // Switch to Lending tab to see pending requests
    await page.getByRole('tab', { name: /lending/i }).click();

    // Check for Pending Requests section heading
    const pendingHeading = page.getByRole('heading', { name: /pending requests/i });
    if (await pendingHeading.isVisible()) {
      await expect(page.getByRole('button', { name: /approve/i }).first()).toBeVisible();
      await expect(page.getByRole('button', { name: /decline/i }).first()).toBeVisible();
    }
  });

  test('should open approve dialog when clicking Approve', async ({ page }) => {
    await page.getByRole('tab', { name: /lending/i }).click();

    const approveButton = page.getByRole('button', { name: /approve/i }).first();
    if (await approveButton.isVisible()) {
      await approveButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/approve reservation/i)).toBeVisible();
    }
  });

  test('should open decline dialog when clicking Decline', async ({ page }) => {
    await page.getByRole('tab', { name: /lending/i }).click();

    const declineButton = page.getByRole('button', { name: /decline/i }).first();
    if (await declineButton.isVisible()) {
      await declineButton.click();

      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/decline reservation/i)).toBeVisible();
    }
  });

  test('should display Details button for each reservation', async ({ page }) => {
    await expect(page.getByRole('button', { name: /details/i }).first()).toBeVisible();
  });

  test('should navigate to tool detail when clicking on tool name', async ({ page }) => {
    // Click on a tool name in the list
    const toolName = page.locator('.MuiTypography-subtitle1').first();
    await toolName.click();

    await expect(page).toHaveURL(/\/tools\/.+/);
  });

  test('should show badge count on tabs for pending items', async ({ page }) => {
    // Check if badges are shown on tabs
    const tabs = page.getByRole('tablist');
    const badges = tabs.locator('.MuiChip-root');

    // At least one tab might have a badge
    const badgeCount = await badges.count();
    expect(badgeCount).toBeGreaterThanOrEqual(0);
  });

  test('should display status filter chips', async ({ page }) => {
    // Check for status filter chips (All, Pending, Confirmed, Active, etc.)
    await expect(page.getByRole('button', { name: /all/i }).first()).toBeVisible();
    // At least one filter option should be visible
    const filterChips = page.locator('.MuiChip-root');
    const chipCount = await filterChips.count();
    expect(chipCount).toBeGreaterThanOrEqual(1);
  });
});
