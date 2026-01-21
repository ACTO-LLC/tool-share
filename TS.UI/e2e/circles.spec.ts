import { test, expect } from '@playwright/test';

test.describe('Circles', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/circles');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /my circles/i })).toBeVisible();
  });

  test('should display Create Circle button', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /create circle/i }).first()).toBeVisible();
  });

  test('should display Join Circle button', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(500);
    await expect(page.getByRole('button', { name: /join circle/i }).first()).toBeVisible();
  });

  test('should navigate to Create Circle page', async ({ page }) => {
    await page.waitForTimeout(500);
    await page.getByRole('button', { name: /create circle/i }).first().click();
    await expect(page).toHaveURL('/circles/create');
    await expect(page.getByRole('heading', { name: /create a new circle/i })).toBeVisible();
  });

  test('should navigate to Join Circle page', async ({ page }) => {
    await page.getByRole('button', { name: /join circle/i }).click();
    await expect(page).toHaveURL('/circles/join');
    await expect(page.getByRole('heading', { name: /join a circle/i })).toBeVisible();
  });

  test('should display either empty state or circle cards', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000);

    // Check for empty state message or circle cards
    const emptyMessage = page.getByText(/not a member of any circles/i);
    const circleCards = page.locator('.MuiCard-root').filter({ has: page.locator('.MuiCardActionArea-root') });

    const hasEmptyState = await emptyMessage.isVisible().catch(() => false);
    const hasCircles = await circleCards.count() > 0;

    // Either empty state or circle cards should be visible
    expect(hasEmptyState || hasCircles).toBeTruthy();
  });

  test('should display circle card content when circles exist', async ({ page }) => {
    // Wait for loading to complete
    await page.waitForTimeout(1000);

    const circleCards = page.locator('.MuiCard-root').filter({ has: page.locator('.MuiCardActionArea-root') });
    const cardCount = await circleCards.count();

    if (cardCount > 0) {
      // Check that at least one card has text content
      const firstCard = circleCards.first();
      await expect(firstCard).toBeVisible();
      // Card should have some text (circle name)
      const cardText = await firstCard.textContent();
      expect(cardText?.length).toBeGreaterThan(0);
    }
  });

  test('should display member count on circle cards', async ({ page }) => {
    await page.waitForTimeout(500);

    const circleCards = page.locator('.MuiCard-root').filter({ has: page.locator('.MuiCardActionArea-root') });
    const cardCount = await circleCards.count();

    if (cardCount > 0) {
      // Check for member count text
      await expect(page.getByText(/member/i).first()).toBeVisible();
    }
  });

  test('should display role chips on circle cards', async ({ page }) => {
    await page.waitForTimeout(500);

    const circleCards = page.locator('.MuiCard-root').filter({ has: page.locator('.MuiCardActionArea-root') });
    const cardCount = await circleCards.count();

    if (cardCount > 0) {
      // Check for role chips (Owner, Admin, or Member)
      const roleChips = page.locator('.MuiChip-root');
      await expect(roleChips.first()).toBeVisible();
    }
  });

  test('should navigate to circle detail when clicking a card', async ({ page }) => {
    await page.waitForTimeout(500);

    const circleCards = page.locator('.MuiCard-root').filter({ has: page.locator('.MuiCardActionArea-root') });
    const cardCount = await circleCards.count();

    if (cardCount > 0) {
      await circleCards.first().click();
      await expect(page).toHaveURL(/\/circles\/.+/);
    }
  });

  test('should show Join with Code button in empty state', async ({ page }) => {
    await page.waitForTimeout(500);

    const emptyMessage = page.getByText(/not a member of any circles/i);
    if (await emptyMessage.isVisible()) {
      await expect(page.getByRole('button', { name: /join with code/i })).toBeVisible();
    }
  });
});
