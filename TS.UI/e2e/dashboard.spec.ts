import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // TODO: Add auth setup when B2C is configured
    // For now, mock auth or use test user
    await page.goto('/');
  });

  test('should display welcome message', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 4 })).toContainText('Welcome back');
  });

  test('should display stats cards', async ({ page }) => {
    // Stats are in the main content area, check the paragraph text (not headings)
    const main = page.getByRole('main');
    await expect(main.getByText('Tools Listed')).toBeVisible();
    await expect(main.getByText('Active Loans')).toBeVisible();
    // Use first() since "Pending Requests" may appear both as stat label and section heading
    await expect(main.locator('p').filter({ hasText: 'Pending Requests' }).first()).toBeVisible();
  });

  test('should display quick actions', async ({ page }) => {
    // Quick actions are in the main content, not the navigation sidebar
    const main = page.getByRole('main');
    await expect(main.getByRole('button', { name: /add tool/i })).toBeVisible();
    await expect(main.getByRole('button', { name: /browse tools/i })).toBeVisible();
  });

  test('should navigate to Add Tool page', async ({ page }) => {
    await page.getByRole('button', { name: /add tool/i }).click();
    await expect(page).toHaveURL('/my-tools/add');
    await expect(page.getByRole('heading', { name: /add new tool/i })).toBeVisible();
  });

  test('should navigate to Browse Tools page', async ({ page }) => {
    // Click the Browse Tools button in main content (not sidebar nav)
    await page.getByRole('main').getByRole('button', { name: /browse tools/i }).click();
    await expect(page).toHaveURL('/browse');
  });

  test('should display My Tools section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my tools/i })).toBeVisible();
  });

  test('should navigate to My Tools when clicking View All', async ({ page }) => {
    await page.getByRole('button', { name: /view all/i }).click();
    await expect(page).toHaveURL('/my-tools');
  });
});
