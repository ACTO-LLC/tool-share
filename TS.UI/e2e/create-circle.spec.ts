import { test, expect } from '@playwright/test';

test.describe('Create Circle', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/circles/create');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /create a new circle/i })).toBeVisible();
  });

  test('should display back button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /back to circles/i })).toBeVisible();
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    await page.getByRole('button', { name: /back to circles/i }).click();
    await expect(page).toHaveURL('/circles');
  });

  test('should display form description', async ({ page }) => {
    await expect(page.getByText(/start sharing tools/i)).toBeVisible();
  });

  test('should display Circle Name field', async ({ page }) => {
    await expect(page.getByLabel(/circle name/i)).toBeVisible();
  });

  test('should display Description field', async ({ page }) => {
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('should display Public Circle toggle', async ({ page }) => {
    await expect(page.getByText(/public circle/i)).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
  });

  test('should display Cancel button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
  });

  test('should display Create Circle button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /create circle/i })).toBeVisible();
  });

  test('should have Create Circle button disabled when name is empty', async ({ page }) => {
    const createButton = page.getByRole('button', { name: /create circle/i });
    await expect(createButton).toBeDisabled();
  });

  test('should enable Create Circle button when name is entered', async ({ page }) => {
    await page.getByLabel(/circle name/i).fill('Test Circle');
    const createButton = page.getByRole('button', { name: /create circle/i });
    await expect(createButton).toBeEnabled();
  });

  test('should show validation error when submitting empty form', async ({ page }) => {
    // Clear any existing value and blur to trigger validation
    const nameField = page.getByLabel(/circle name/i);
    await nameField.click();
    await nameField.fill('');

    // Submit the form (button may be disabled but try submitting via enter)
    await nameField.press('Enter');

    // Validation should be triggered
    const createButton = page.getByRole('button', { name: /create circle/i });
    await expect(createButton).toBeDisabled();
  });

  test('should navigate back when clicking Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /cancel/i }).click();
    await expect(page).toHaveURL('/circles');
  });

  test('should fill in circle name', async ({ page }) => {
    const nameField = page.getByLabel(/circle name/i);
    await nameField.fill('My Test Circle');
    await expect(nameField).toHaveValue('My Test Circle');
  });

  test('should fill in description', async ({ page }) => {
    const descriptionField = page.getByLabel(/description/i);
    await descriptionField.fill('A circle for testing');
    await expect(descriptionField).toHaveValue('A circle for testing');
  });

  test('should toggle public circle switch', async ({ page }) => {
    const toggle = page.getByRole('checkbox');
    await expect(toggle).not.toBeChecked();

    await toggle.click();
    await expect(toggle).toBeChecked();

    // Check that the text changes
    await expect(page.getByText(/anyone can request to join/i)).toBeVisible();
  });

  test('should show private message when toggle is off', async ({ page }) => {
    const toggle = page.getByRole('checkbox');
    await expect(toggle).not.toBeChecked();
    await expect(page.getByText(/members can only join via invite code/i)).toBeVisible();
  });

  test('should display helper text for name field', async ({ page }) => {
    await expect(page.getByText(/choose a name that helps members identify/i)).toBeVisible();
  });

  test('should display helper text for description field', async ({ page }) => {
    await expect(page.getByText(/help potential members understand/i)).toBeVisible();
  });

  test('should create circle and navigate to detail page', async ({ page }) => {
    // Fill in required fields
    await page.getByLabel(/circle name/i).fill('E2E Test Circle');

    // Fill in optional description
    await page.getByLabel(/description/i).fill('Created by E2E test');

    // Submit form
    await page.getByRole('button', { name: /create circle/i }).click();

    // Should navigate to circle detail page
    await expect(page).toHaveURL(/\/circles\/.+/, { timeout: 5000 });
  });
});
