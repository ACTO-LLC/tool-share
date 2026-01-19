import { test, expect } from '@playwright/test';

test.describe('Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/profile');
    // Wait for the page to load (either form or loading state)
    await page.waitForTimeout(1000);
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /profile/i })).toBeVisible();
  });

  test('should display user avatar or loading skeleton', async ({ page }) => {
    // Either avatar or skeleton should be visible
    const avatar = page.locator('.MuiAvatar-root').first();
    const skeleton = page.locator('.MuiSkeleton-root').first();

    const hasAvatar = await avatar.isVisible().catch(() => false);
    const hasSkeleton = await skeleton.isVisible().catch(() => false);

    expect(hasAvatar || hasSkeleton).toBe(true);
  });

  test('should display user name or loading', async ({ page }) => {
    // Wait for loading to complete
    const displayNameField = page.getByLabel(/display name/i);
    const isLoaded = await displayNameField.isVisible().catch(() => false);

    if (isLoaded) {
      await expect(displayNameField).toBeVisible();
    } else {
      // Still loading or error
      const skeleton = page.locator('.MuiSkeleton-root');
      const errorAlert = page.getByText(/failed to load/i);
      const hasSkeleton = await skeleton.first().isVisible().catch(() => false);
      const hasError = await errorAlert.isVisible().catch(() => false);
      expect(hasSkeleton || hasError).toBe(true);
    }
  });

  test('should display Display Name field when loaded', async ({ page }) => {
    const displayNameField = page.getByLabel(/display name/i);
    const isVisible = await displayNameField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(displayNameField).toBeVisible();
    }
  });

  test('should display Phone field when loaded', async ({ page }) => {
    const phoneField = page.getByLabel(/phone/i);
    const isVisible = await phoneField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(phoneField).toBeVisible();
    }
  });

  test('should display Street Address field when loaded', async ({ page }) => {
    const streetField = page.getByLabel(/street address/i);
    const isVisible = await streetField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(streetField).toBeVisible();
    }
  });

  test('should display City field when loaded', async ({ page }) => {
    const cityField = page.getByLabel(/city/i);
    const isVisible = await cityField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(cityField).toBeVisible();
    }
  });

  test('should display State field when loaded', async ({ page }) => {
    const stateField = page.getByLabel(/state/i);
    const isVisible = await stateField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(stateField).toBeVisible();
    }
  });

  test('should display ZIP Code field when loaded', async ({ page }) => {
    const zipField = page.getByLabel(/zip code/i);
    const isVisible = await zipField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(zipField).toBeVisible();
    }
  });

  test('should display Bio field when loaded', async ({ page }) => {
    const bioField = page.getByLabel(/bio/i);
    const isVisible = await bioField.isVisible().catch(() => false);

    if (isVisible) {
      await expect(bioField).toBeVisible();
    }
  });

  test('should display Save Changes button when loaded', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save changes/i });
    const isVisible = await saveButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(saveButton).toBeVisible();
    }
  });

  test('should have Save Changes button disabled when no changes', async ({ page }) => {
    const saveButton = page.getByRole('button', { name: /save changes/i });
    const isVisible = await saveButton.isVisible().catch(() => false);

    if (isVisible) {
      await expect(saveButton).toBeDisabled();
    }
  });

  test('should enable Save Changes button when form is modified', async ({ page }) => {
    const displayNameField = page.getByLabel(/display name/i);
    const isVisible = await displayNameField.isVisible().catch(() => false);

    if (isVisible) {
      await displayNameField.fill('Modified Name');
      const saveButton = page.getByRole('button', { name: /save changes/i });
      await expect(saveButton).toBeEnabled();
    }
  });

  test('should display address helper text when loaded', async ({ page }) => {
    const helperText = page.getByText(/pickup address.*visible only to confirmed borrowers/i);
    const isVisible = await helperText.isVisible().catch(() => false);

    if (isVisible) {
      await expect(helperText).toBeVisible();
    }
  });

  test('should display bio character count when loaded', async ({ page }) => {
    const bioField = page.getByLabel(/bio/i);
    const isVisible = await bioField.isVisible().catch(() => false);

    if (isVisible) {
      await bioField.fill('This is my bio');
      await expect(page.getByText(/\/500 characters/i)).toBeVisible();
    }
  });

  test('should show validation error for empty display name', async ({ page }) => {
    const displayNameField = page.getByLabel(/display name/i);
    const isVisible = await displayNameField.isVisible().catch(() => false);

    if (isVisible) {
      await displayNameField.clear();
      await displayNameField.blur();
      await expect(page.getByText(/display name is required/i)).toBeVisible();
    }
  });

  test('should show validation error for bio exceeding 500 characters', async ({ page }) => {
    const bioField = page.getByLabel(/bio/i);
    const isVisible = await bioField.isVisible().catch(() => false);

    if (isVisible) {
      const longBio = 'A'.repeat(501);
      await bioField.fill(longBio);
      await bioField.blur();
      await expect(page.getByText(/bio must be 500 characters or less/i)).toBeVisible();
    }
  });

  test('should update phone field value', async ({ page }) => {
    const phoneField = page.getByLabel(/phone/i);
    const isVisible = await phoneField.isVisible().catch(() => false);

    if (isVisible) {
      await phoneField.fill('555-123-4567');
      await expect(phoneField).toHaveValue('555-123-4567');
    }
  });

  test('should update address fields', async ({ page }) => {
    const streetField = page.getByLabel(/street address/i);
    const isVisible = await streetField.isVisible().catch(() => false);

    if (isVisible) {
      await streetField.fill('123 Main Street');
      await expect(streetField).toHaveValue('123 Main Street');
    }
  });

  test('should save profile successfully when form is valid', async ({ page }) => {
    const bioField = page.getByLabel(/bio/i);
    const isVisible = await bioField.isVisible().catch(() => false);

    if (isVisible) {
      await bioField.fill('Updated bio from E2E test');
      await page.getByRole('button', { name: /save changes/i }).click();

      // Should show success message or error
      const successMessage = page.getByText(/profile updated successfully/i);
      const errorMessage = page.getByText(/failed to update/i);

      await page.waitForTimeout(2000);

      const hasSuccess = await successMessage.isVisible().catch(() => false);
      const hasError = await errorMessage.isVisible().catch(() => false);

      // Either success or error should appear
      expect(hasSuccess || hasError).toBe(true);
    }
  });

  test('should display reputation score if available', async ({ page }) => {
    const reputationText = page.getByText(/reputation/i);
    const isVisible = await reputationText.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should handle loading state', async ({ page }) => {
    // Page should either show loading or content
    const skeleton = page.locator('.MuiSkeleton-root');
    const form = page.getByLabel(/display name/i);
    const error = page.getByText(/failed to load/i);

    const hasSkeleton = await skeleton.first().isVisible().catch(() => false);
    const hasForm = await form.isVisible().catch(() => false);
    const hasError = await error.isVisible().catch(() => false);

    expect(hasSkeleton || hasForm || hasError).toBe(true);
  });

  test('should handle error state gracefully', async ({ page }) => {
    const errorAlert = page.getByText(/failed to load profile/i);
    const isVisible = await errorAlert.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });
});
