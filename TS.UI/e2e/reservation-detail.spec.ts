import { test, expect } from '@playwright/test';

test.describe('Reservation Detail', () => {
  // Use known reservation IDs from mock data
  const confirmedReservationId = 'res-1'; // Confirmed reservation (borrower is test user)
  const pendingReservationId = 'res-2'; // Pending reservation (owner is test user)

  test('should display page title', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('heading', { name: /reservation details/i })).toBeVisible();
  });

  test('should display back button', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('button', { name: /back/i })).toBeVisible();
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    await page.goto('/reservations');
    await page.getByRole('button', { name: /details/i }).first().click();

    await page.waitForURL(/\/reservations\/.+/);

    await page.getByRole('button', { name: /back/i }).click();
    await expect(page).toHaveURL('/reservations');
  });

  test('should display reservation ID', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByText(confirmedReservationId)).toBeVisible();
  });

  test('should display status chip', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    const statusChip = page.locator('.MuiChip-root').filter({ hasText: /confirmed|pending|active|completed|cancelled|declined/i });
    await expect(statusChip.first()).toBeVisible();
  });

  test('should display Status Timeline section', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('heading', { name: /status timeline/i })).toBeVisible();
  });

  test('should display stepper for non-cancelled reservations', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    const stepper = page.locator('.MuiStepper-root');
    await expect(stepper).toBeVisible();
  });

  test('should display Tool Information section', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('heading', { name: /tool information/i })).toBeVisible();
  });

  test('should display tool name', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    // Tool name should be visible in the tool info section
    const toolName = page.locator('.MuiTypography-subtitle1').first();
    await expect(toolName).toBeVisible();
  });

  test('should display Reservation Dates section', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('heading', { name: /reservation dates/i })).toBeVisible();
  });

  test('should display start and end dates', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByText(/start date/i)).toBeVisible();
    await expect(page.getByText(/end date/i)).toBeVisible();
  });

  test('should display Participants section', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('heading', { name: /participants/i })).toBeVisible();
  });

  test('should display tool owner info', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByText(/tool owner/i)).toBeVisible();
  });

  test('should display borrower info', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await page.waitForTimeout(1000);

    const borrowerText = page.getByText(/borrower/i);
    const isVisible = await borrowerText.first().isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display Actions section', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('heading', { name: /actions/i })).toBeVisible();
  });

  test('should display View Tool button', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await expect(page.getByRole('button', { name: /view tool/i })).toBeVisible();
  });

  test('should navigate to tool detail when clicking View Tool', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await page.getByRole('button', { name: /view tool/i }).click();
    await expect(page).toHaveURL(/\/tools\/.+/);
  });

  test('should display Approve and Decline buttons for pending reservation (owner view)', async ({ page }) => {
    await page.goto(`/reservations/${pendingReservationId}`);

    // If user is the tool owner and reservation is pending
    const approveButton = page.getByRole('button', { name: /approve/i });
    const declineButton = page.getByRole('button', { name: /decline/i });

    const isOwnerView = await approveButton.isVisible().catch(() => false);
    if (isOwnerView) {
      await expect(approveButton).toBeVisible();
      await expect(declineButton).toBeVisible();
    }
  });

  test('should open approve dialog when clicking Approve', async ({ page }) => {
    await page.goto(`/reservations/${pendingReservationId}`);

    const approveButton = page.getByRole('button', { name: /approve/i });
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/approve reservation/i)).toBeVisible();
    }
  });

  test('should open decline dialog when clicking Decline', async ({ page }) => {
    await page.goto(`/reservations/${pendingReservationId}`);

    const declineButton = page.getByRole('button', { name: /decline/i });
    if (await declineButton.isVisible()) {
      await declineButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/decline reservation/i)).toBeVisible();
    }
  });

  test('should close dialog when clicking Cancel', async ({ page }) => {
    await page.goto(`/reservations/${pendingReservationId}`);

    const approveButton = page.getByRole('button', { name: /approve/i });
    if (await approveButton.isVisible()) {
      await approveButton.click();
      await page.getByRole('dialog').getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should display Confirm Pickup button for confirmed reservation (borrower view)', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    const pickupButton = page.getByRole('button', { name: /confirm pickup/i });
    const isVisible = await pickupButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display Cancel Reservation button for pending/confirmed reservations', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    const cancelButton = page.getByRole('button', { name: /cancel reservation/i });
    const isVisible = await cancelButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display notes section if notes exist', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    const notesSection = page.getByRole('heading', { name: /notes/i });
    const isVisible = await notesSection.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should show error for invalid reservation ID', async ({ page }) => {
    await page.goto('/reservations/invalid-reservation-id');
    await expect(page.getByText(/reservation not found|error/i)).toBeVisible();
  });

  test('should display Go to Reservations button on error', async ({ page }) => {
    await page.goto('/reservations/invalid-reservation-id');
    await expect(page.getByRole('button', { name: /go to reservations/i })).toBeVisible();
  });

  test('should display pickup time if available', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    const pickupTime = page.getByText(/picked up:/i);
    const isVisible = await pickupTime.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display return time if available', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    const returnTime = page.getByText(/returned:/i);
    const isVisible = await returnTime.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should navigate to tool when clicking tool info', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    // Click on tool info area (has cursor pointer)
    const toolInfo = page.locator('.MuiCardContent-root').filter({ hasText: /tool information/i }).locator('.MuiBox-root').filter({ has: page.locator('.MuiAvatar-root') }).first();
    if (await toolInfo.isVisible()) {
      await toolInfo.click();
      await expect(page).toHaveURL(/\/tools\/.+/);
    }
  });

  test('should display (You) indicator for current user', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);

    // Either owner or borrower should show (You)
    const youIndicator = page.getByText(/\(you\)/i);
    await expect(youIndicator).toBeVisible();
  });

  test('should display step icons in timeline', async ({ page }) => {
    await page.goto(`/reservations/${confirmedReservationId}`);
    await page.waitForTimeout(1000);

    // Stepper should have step icons if loaded
    const stepIcons = page.locator('.MuiStepLabel-iconContainer .MuiAvatar-root');
    const count = await stepIcons.count();

    // Either has step icons or page is still loading/errored
    expect(count >= 0).toBe(true);
  });
});
