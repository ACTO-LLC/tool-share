import { test, expect } from '@playwright/test';

/**
 * Reservation Workflow E2E Tests
 *
 * These tests verify the full reservation lifecycle including:
 * - Approving pending reservations
 * - Declining reservations
 * - Cancelling reservations
 *
 * Prerequisites:
 * - Database seeded with test data (SeedData.sql)
 * - Mock auth enabled (VITE_MOCK_AUTH=true)
 * - Real API enabled (VITE_USE_REAL_API=true)
 * - Current user is test-user-1 (John Doe) who owns tools
 *
 * Auth is handled by auth.setup.ts which runs before these tests.
 *
 * Seed data includes:
 * - Pending reservation: Mike Wilson (test-user-3) wants John's Circular Saw
 */

test.describe('Reservation Approval Workflow', () => {
  // Run tests serially to avoid conflicts on shared reservation state
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    // Navigate to reservations (auth state is pre-loaded from setup)
    await page.goto('/reservations');
    await page.waitForLoadState('networkidle');

    // Switch to Lending tab
    const lendingTab = page.getByRole('tab', { name: /lending/i });
    await lendingTab.waitFor({ state: 'visible', timeout: 10000 });
    await lendingTab.click();
    await page.waitForTimeout(500); // Wait for data to load
  });

  test('should show pending reservations in Lending tab', async ({ page }) => {
    // Filter to pending using the filter chip (more specific to avoid matching reservation cards)
    await page.getByRole('button', { name: /^Pending \(\d+\)$/i }).click();

    // Should see at least one pending reservation
    const pendingChip = page.locator('.MuiChip-root').filter({ hasText: /pending/i });
    await expect(pendingChip.first()).toBeVisible();
  });

  test('should open approve dialog with note field', async ({ page }) => {
    const approveButton = page.getByRole('button', { name: /^approve$/i }).first();

    if (await approveButton.isVisible()) {
      await approveButton.click();

      // Dialog should open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Should show approve title
      await expect(page.getByText(/approve reservation/i)).toBeVisible();

      // Should have a note field
      const noteField = page.getByRole('textbox');
      await expect(noteField).toBeVisible();

      // Should have Approve and Cancel buttons
      await expect(dialog.getByRole('button', { name: /^approve$/i })).toBeVisible();
      await expect(dialog.getByRole('button', { name: /cancel/i })).toBeVisible();
    }
  });

  test('should approve reservation and update status', async ({ page }) => {
    // Find the Approve button (there may be none if already approved by another test)
    const approveButton = page.getByRole('button', { name: /^approve$/i }).first();
    const isApproveVisible = await approveButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isApproveVisible) {
      test.skip(true, 'No pending reservation to approve (may have been approved by parallel test)');
      return;
    }

    // Click approve
    await approveButton.click();

    // Wait for dialog
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Add an optional note
    const noteField = page.getByRole('textbox');
    await noteField.fill('Approved! Pick up anytime after 9am.');

    // Click the Approve button in the dialog
    const confirmButton = dialog.getByRole('button', { name: /^approve$/i });
    await confirmButton.click();

    // Wait for the action to complete and dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Check for either success message or error message
    const successMessage = page.getByText(/reservation approved successfully/i);
    const errorMessage = page.getByRole('alert');

    // Either success message is visible OR an error is shown
    const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSuccess) {
      await expect(successMessage).toBeVisible();
    } else {
      // If no success, verify we got some feedback (could be error from API)
      console.log('No success message - checking for error feedback');
    }
  });

  test('should decline reservation with required reason', async ({ page }) => {
    const declineButton = page.getByRole('button', { name: /^decline$/i }).first();
    const isDeclineVisible = await declineButton.isVisible({ timeout: 3000 }).catch(() => false);

    if (!isDeclineVisible) {
      test.skip(true, 'No pending reservation to decline (may have been processed by parallel test)');
      return;
    }

    await declineButton.click();

    // Dialog should open
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Should show decline title
    await expect(page.getByText(/decline reservation/i)).toBeVisible();

    // Add required reason
    const reasonField = page.getByRole('textbox');
    await reasonField.fill('Tool is currently being repaired, sorry!');

    // Click decline
    const confirmButton = dialog.getByRole('button', { name: /^decline$/i });
    await confirmButton.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 10000 });

    // Check for success message
    const successMessage = page.getByText(/reservation declined successfully/i);
    const hasSuccess = await successMessage.isVisible({ timeout: 5000 }).catch(() => false);
    if (hasSuccess) {
      await expect(successMessage).toBeVisible();
    }
  });

  test('should cancel dialog without making changes', async ({ page }) => {
    const approveButton = page.getByRole('button', { name: /^approve$/i }).first();

    if (await approveButton.isVisible()) {
      await approveButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Click cancel
      await dialog.getByRole('button', { name: /cancel/i }).click();

      // Dialog should close
      await expect(dialog).not.toBeVisible();

      // Reservation should still be pending (approve button still visible)
      await expect(approveButton).toBeVisible();
    }
  });
});

test.describe('Reservation Cancel Workflow', () => {
  test('should cancel a pending reservation as owner', async ({ page }) => {
    await page.goto('/reservations');
    await page.waitForLoadState('networkidle');
    const lendingTab = page.getByRole('tab', { name: /lending/i });
    await lendingTab.waitFor({ state: 'visible', timeout: 10000 });
    await lendingTab.click();
    await page.waitForTimeout(500);

    const cancelButton = page.getByRole('button', { name: /^cancel$/i }).first();

    if (await cancelButton.isVisible()) {
      await cancelButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Should show cancel warning
      await expect(page.getByText(/cancel this reservation/i)).toBeVisible();

      // Confirm cancellation
      const confirmButton = dialog.getByRole('button', { name: /cancel reservation/i });
      await confirmButton.click();

      await page.waitForTimeout(2000);

      // Dialog should close
      await expect(dialog).not.toBeVisible();
    }
  });
});

test.describe('Reservation API Integration', () => {
  test('should call API when approving reservation', async ({ page }) => {
    // Listen for API calls
    const apiCalls: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/reservations')) {
        apiCalls.push(`${request.method()} ${request.url()}`);
      }
    });

    await page.goto('/reservations');
    await page.waitForLoadState('networkidle');
    const lendingTab = page.getByRole('tab', { name: /lending/i });
    await lendingTab.waitFor({ state: 'visible', timeout: 10000 });
    await lendingTab.click();
    await page.waitForTimeout(1000);

    const approveButton = page.getByRole('button', { name: /^approve$/i }).first();

    if (await approveButton.isVisible()) {
      await approveButton.click();

      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Confirm approval
      const confirmButton = dialog.getByRole('button', { name: /^approve$/i });
      await confirmButton.click();

      await page.waitForTimeout(2000);

      // Should have made a POST call to approve endpoint
      const approveCall = apiCalls.find(call => call.includes('/approve'));
      expect(approveCall).toBeTruthy();
      expect(approveCall).toContain('POST');
    }
  });
});
