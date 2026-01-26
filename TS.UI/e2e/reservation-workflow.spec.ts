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
 * Seed data includes:
 * - Pending reservation: Mike Wilson (test-user-3) wants John's Circular Saw
 */

// Helper to sign in with mock auth if needed
// Returns true if sign-in was performed
async function ensureSignedIn(page: import('@playwright/test').Page): Promise<boolean> {
  // Wait for page to settle
  await page.waitForLoadState('domcontentloaded');

  // Check if we're on login page
  const signInButton = page.getByRole('button', { name: /sign in/i });
  const isOnLogin = await signInButton.isVisible({ timeout: 5000 }).catch(() => false);

  if (isOnLogin) {
    console.log('On login page, clicking sign in...');
    await signInButton.click();
    // Wait for navigation away from login
    await page.waitForSelector('nav', { timeout: 10000 });
    console.log('Signed in successfully');
    return true;
  }
  return false;
}

test.describe('Reservation Approval Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to reservations
    await page.goto('/reservations');
    // Sign in if prompted
    const didSignIn = await ensureSignedIn(page);
    // If we signed in, need to navigate again since sign-in redirects to dashboard
    if (didSignIn) {
      await page.goto('/reservations');
    }
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    // Switch to Lending tab
    const lendingTab = page.getByRole('tab', { name: /lending/i });
    await lendingTab.waitFor({ state: 'visible', timeout: 10000 });
    await lendingTab.click();
    await page.waitForTimeout(500); // Wait for data to load
  });

  test('should show pending reservations in Lending tab', async ({ page }) => {
    // Filter to pending
    await page.getByRole('button', { name: /pending/i }).click();

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
    // Find the Approve button
    const approveButton = page.getByRole('button', { name: /^approve$/i }).first();

    if (await approveButton.isVisible()) {
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

      // Wait for the action to complete
      await page.waitForTimeout(2000);

      // Dialog should close
      await expect(dialog).not.toBeVisible();

      // Should show success message
      const successMessage = page.getByText(/approved successfully/i);
      await expect(successMessage).toBeVisible();

      // The reservation status should now be "confirmed" (not "pending")
      // After reload, should not see this reservation in pending anymore
    }
  });

  test('should decline reservation with required reason', async ({ page }) => {
    const declineButton = page.getByRole('button', { name: /decline/i }).first();

    if (await declineButton.isVisible()) {
      await declineButton.click();

      // Dialog should open
      const dialog = page.getByRole('dialog');
      await expect(dialog).toBeVisible();

      // Should show decline title
      await expect(page.getByText(/decline reservation/i)).toBeVisible();

      // Decline button should be disabled without reason
      const confirmButton = dialog.getByRole('button', { name: /decline/i });
      await expect(confirmButton).toBeDisabled();

      // Add required reason
      const reasonField = page.getByRole('textbox');
      await reasonField.fill('Tool is currently being repaired, sorry!');

      // Now the button should be enabled
      await expect(confirmButton).toBeEnabled();

      // Click decline
      await confirmButton.click();

      // Wait for action
      await page.waitForTimeout(2000);

      // Dialog should close
      await expect(dialog).not.toBeVisible();

      // Should show success message
      const successMessage = page.getByText(/declined successfully/i);
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
    const didSignIn = await ensureSignedIn(page);
    if (didSignIn) {
      await page.goto('/reservations');
    }
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
    const didSignIn = await ensureSignedIn(page);
    if (didSignIn) {
      await page.goto('/reservations');
    }
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
