import { test, expect } from '@playwright/test';

test.describe('My Tools', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-tools');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my tools/i })).toBeVisible();
  });

  test('should display Add Tool button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /add tool/i })).toBeVisible();
  });

  test('should display tool count info', async ({ page }) => {
    await expect(page.getByText(/tool.*listed/i)).toBeVisible();
  });

  test('should display tool cards', async ({ page }) => {
    // Should have tool cards (mock user has tools)
    const toolCards = page.locator('.MuiCard-root');
    await expect(toolCards.first()).toBeVisible();
  });

  test('should display tool status and category chips', async ({ page }) => {
    await expect(page.getByText('available').first()).toBeVisible();
  });

  test('should open menu when clicking more button on tool card', async ({ page }) => {
    // Click the more (vertical dots) button on first tool
    await page.locator('[data-testid="MoreVertIcon"]').first().click();

    // Menu should appear with options
    await expect(page.getByRole('menuitem', { name: /view details/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /edit/i })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: /delete/i })).toBeVisible();
  });

  test('should navigate to tool detail when clicking View Details in menu', async ({ page }) => {
    await page.locator('[data-testid="MoreVertIcon"]').first().click();
    await page.getByRole('menuitem', { name: /view details/i }).click();

    await expect(page).toHaveURL(/\/tools\/.+/);
  });

  test('should show delete confirmation dialog', async ({ page }) => {
    await page.locator('[data-testid="MoreVertIcon"]').first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText(/are you sure/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /delete/i })).toBeVisible();
  });

  test('should close delete dialog when clicking Cancel', async ({ page }) => {
    await page.locator('[data-testid="MoreVertIcon"]').first().click();
    await page.getByRole('menuitem', { name: /delete/i }).click();

    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page.getByRole('dialog')).not.toBeVisible();
  });

  test('should navigate to Add Tool page', async ({ page }) => {
    await page.getByRole('button', { name: /add tool/i }).click();

    await expect(page).toHaveURL('/my-tools/add');
  });

  test('should navigate to tool detail when clicking tool card', async ({ page }) => {
    // Click on the card content (not the menu button)
    await page.locator('.MuiCardContent-root').first().click();

    await expect(page).toHaveURL(/\/tools\/.+/);
  });
});
