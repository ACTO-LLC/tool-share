import { test as setup, expect } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const authFile = join(__dirname, '../playwright/.auth/user.json');

/**
 * Global auth setup for Playwright tests
 * This runs once before all tests and saves the auth state to a file
 * that can be reused by all test workers.
 */
setup('authenticate', async ({ page }) => {
  // Go to the app
  await page.goto('/');

  // Set up mock auth state in localStorage BEFORE the app checks auth
  await page.evaluate(() => {
    // Mock auth storage key (must match MockAuthProvider)
    localStorage.setItem('mock_auth_authenticated', 'true');

    // Additional flags for E2E testing
    localStorage.setItem('e2e-testing', 'true');
  });

  // Now visit the login page and click sign in (if needed)
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  const signInButton = page.getByRole('button', { name: /sign in/i });
  if (await signInButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await signInButton.click();
    // Wait for navigation to dashboard
    await page.waitForSelector('nav', { timeout: 10000 });
  }

  // Verify we're authenticated
  await expect(page.locator('nav')).toBeVisible();

  // Save the authenticated state to file
  await page.context().storageState({ path: authFile });
});
