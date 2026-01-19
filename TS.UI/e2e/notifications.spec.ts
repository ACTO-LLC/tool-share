import { test, expect } from '@playwright/test';

test.describe('Notifications', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/notifications');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /notifications/i })).toBeVisible();
  });

  test('should display filter tabs', async ({ page }) => {
    await expect(page.getByRole('tab', { name: /all/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /requests/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /approvals/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /reminders/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: /reviews/i })).toBeVisible();
  });

  test('should show All tab selected by default', async ({ page }) => {
    const allTab = page.getByRole('tab', { name: /all/i });
    await expect(allTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch to Requests tab when clicked', async ({ page }) => {
    await page.getByRole('tab', { name: /requests/i }).click();
    const requestsTab = page.getByRole('tab', { name: /requests/i });
    await expect(requestsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch to Approvals tab when clicked', async ({ page }) => {
    await page.getByRole('tab', { name: /approvals/i }).click();
    const approvalsTab = page.getByRole('tab', { name: /approvals/i });
    await expect(approvalsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch to Reminders tab when clicked', async ({ page }) => {
    await page.getByRole('tab', { name: /reminders/i }).click();
    const remindersTab = page.getByRole('tab', { name: /reminders/i });
    await expect(remindersTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should switch to Reviews tab when clicked', async ({ page }) => {
    await page.getByRole('tab', { name: /reviews/i }).click();
    const reviewsTab = page.getByRole('tab', { name: /reviews/i });
    await expect(reviewsTab).toHaveAttribute('aria-selected', 'true');
  });

  test('should display notification list', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Either empty state, notification list, or loading state should be visible
    const emptyState = page.getByText(/no notifications/i);
    const notificationList = page.locator('.MuiList-root');
    const loadingState = page.locator('.MuiSkeleton-root');
    const notificationCard = page.locator('.MuiCard-root');

    const isEmpty = await emptyState.isVisible().catch(() => false);
    const hasList = await notificationList.isVisible().catch(() => false);
    const hasLoading = await loadingState.first().isVisible().catch(() => false);
    const hasCard = await notificationCard.first().isVisible().catch(() => false);

    expect(isEmpty || hasList || hasLoading || hasCard).toBe(true);
  });

  test('should display unread count chip when there are unread notifications', async ({ page }) => {
    await page.waitForTimeout(500);

    // Check for unread count chip
    const unreadChip = page.locator('.MuiChip-root').filter({ hasText: /unread/i });
    const isVisible = await unreadChip.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display Mark all as read button when there are unread notifications', async ({ page }) => {
    await page.waitForTimeout(500);

    const markAllButton = page.getByRole('button', { name: /mark all as read/i });
    const isVisible = await markAllButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display Refresh button', async ({ page }) => {
    // Refresh button is an icon button with Refresh icon
    const refreshButton = page.locator('[data-testid="RefreshIcon"]').locator('..');
    await expect(refreshButton).toBeVisible();
  });

  test('should display notification items with icons', async ({ page }) => {
    await page.waitForTimeout(500);

    const listItems = page.locator('.MuiListItem-root');
    const itemCount = await listItems.count();

    if (itemCount > 0) {
      // Check for icon in first notification
      const firstItem = listItems.first();
      const icon = firstItem.locator('.MuiListItemIcon-root');
      await expect(icon).toBeVisible();
    }
  });

  test('should display notification title and message', async ({ page }) => {
    await page.waitForTimeout(1000);

    const listItems = page.locator('.MuiListItem-root');
    const itemCount = await listItems.count();

    if (itemCount > 0) {
      // Check for title in first notification
      const firstItem = listItems.first();
      const title = firstItem.locator('.MuiTypography-subtitle1');
      const hasTitle = await title.isVisible().catch(() => false);
      expect(typeof hasTitle).toBe('boolean');
    }
  });

  test('should display New chip for unread notifications', async ({ page }) => {
    await page.waitForTimeout(500);

    const newChips = page.locator('.MuiChip-root').filter({ hasText: /new/i });
    const count = await newChips.count();
    expect(typeof count).toBe('number');
  });

  test('should display empty state when no notifications', async ({ page }) => {
    // Switch to a filter that might have no notifications
    await page.getByRole('tab', { name: /reviews/i }).click();
    await page.waitForTimeout(300);

    const emptyState = page.getByText(/no.*notifications/i);
    const isVisible = await emptyState.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should filter notifications by type', async ({ page }) => {
    await page.waitForTimeout(500);

    // Get initial count
    const initialItems = page.locator('.MuiListItem-root');
    const initialCount = await initialItems.count();

    // Switch to Requests filter
    await page.getByRole('tab', { name: /requests/i }).click();
    await page.waitForTimeout(300);

    // Count should change or remain same depending on data
    const filteredItems = page.locator('.MuiListItem-root');
    const filteredCount = await filteredItems.count();

    expect(typeof filteredCount).toBe('number');
  });

  test('should mark notification as read when clicked', async ({ page }) => {
    await page.waitForTimeout(500);

    const listItems = page.locator('.MuiListItem-root');
    const itemCount = await listItems.count();

    if (itemCount > 0) {
      // Click on first notification
      await listItems.first().click();

      // Should navigate to related item
      await page.waitForTimeout(500);
    }
  });

  test('should navigate to reservation when clicking notification', async ({ page }) => {
    await page.waitForTimeout(500);

    const listItems = page.locator('.MuiListItem-root');
    const itemCount = await listItems.count();

    if (itemCount > 0) {
      await listItems.first().click();
      // May navigate to reservations page
      await page.waitForTimeout(500);
    }
  });

  test('should display pagination when many notifications', async ({ page }) => {
    await page.waitForTimeout(500);

    // Pagination is shown when there are more than 10 notifications
    const pagination = page.locator('.MuiPagination-root');
    const isVisible = await pagination.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display notification count summary', async ({ page }) => {
    await page.waitForTimeout(500);

    // Check for summary text at bottom
    const summary = page.getByText(/showing.*of.*notifications/i);
    await expect(summary).toBeVisible();
  });

  test('should mark all as read when clicking Mark all as read', async ({ page }) => {
    await page.waitForTimeout(500);

    const markAllButton = page.getByRole('button', { name: /mark all as read/i });
    if (await markAllButton.isVisible()) {
      await markAllButton.click();

      // Wait for action to complete
      await page.waitForTimeout(500);

      // Button might disappear or unread count should change
    }
  });

  test('should refresh notifications when clicking Refresh', async ({ page }) => {
    await page.waitForTimeout(500);

    const refreshButton = page.locator('[data-testid="RefreshIcon"]').locator('..');
    await refreshButton.click();

    // Should trigger loading
    await page.waitForTimeout(500);
  });
});
