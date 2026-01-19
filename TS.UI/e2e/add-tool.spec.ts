import { test, expect } from '@playwright/test';

test.describe('Add Tool', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/my-tools/add');
  });

  test('should display page title', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /add new tool/i })).toBeVisible();
  });

  test('should display UPC lookup field', async ({ page }) => {
    await expect(page.getByLabel(/upc.*barcode/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /lookup/i })).toBeVisible();
  });

  test('should display required form fields', async ({ page }) => {
    await expect(page.getByLabel(/tool name/i)).toBeVisible();
    // MUI Select - find by the form control with Category label
    await expect(page.locator('.MuiFormControl-root').filter({ hasText: 'Category' })).toBeVisible();
  });

  test('should display optional form fields', async ({ page }) => {
    await expect(page.getByLabel(/brand/i)).toBeVisible();
    await expect(page.getByLabel(/model/i)).toBeVisible();
    await expect(page.getByLabel(/description/i)).toBeVisible();
  });

  test('should display loan period slider', async ({ page }) => {
    await expect(page.getByText(/maximum loan period/i)).toBeVisible();
    await expect(page.getByRole('slider').first()).toBeVisible();
  });

  test('should display advance notice slider', async ({ page }) => {
    await expect(page.getByText(/advance notice/i)).toBeVisible();
  });

  test('should display photo upload area', async ({ page }) => {
    await expect(page.getByText(/drag and drop photos/i)).toBeVisible();
  });

  test('should display form buttons', async ({ page }) => {
    await expect(page.getByRole('button', { name: /cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add tool/i })).toBeVisible();
  });

  test('should show validation error when submitting without required fields', async ({ page }) => {
    await page.getByRole('button', { name: /add tool/i }).click();

    // Should show validation errors
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test('should fill in form and submit successfully', async ({ page }) => {
    // Fill required fields
    await page.getByLabel(/tool name/i).fill('Test Power Drill');

    // Select category (MUI Select)
    await page.locator('.MuiFormControl-root').filter({ hasText: 'Category' }).locator('[role="combobox"]').click();
    await page.getByRole('option', { name: 'Power Tools' }).click();

    // Fill optional fields
    await page.getByLabel(/brand/i).fill('TestBrand');
    await page.getByLabel(/model/i).fill('TB-100');
    await page.getByLabel(/description/i).fill('A test tool for E2E testing');

    // Submit form
    await page.getByRole('button', { name: /add tool/i }).click();

    // Should show success message
    await expect(page.getByText(/tool added successfully/i)).toBeVisible();

    // Should redirect to My Tools
    await expect(page).toHaveURL('/my-tools', { timeout: 5000 });
  });

  test('should navigate back when clicking Cancel', async ({ page }) => {
    await page.getByRole('button', { name: /cancel/i }).click();

    await expect(page).toHaveURL('/my-tools');
  });

  test('should navigate back when clicking back arrow', async ({ page }) => {
    // The back button is the first IconButton in the header (contains ArrowBack icon)
    await page.locator('button').filter({ has: page.locator('[data-testid="ArrowBackIcon"]') }).click();

    await expect(page).toHaveURL('/my-tools');
  });

  test('should show UPC lookup error for unknown barcode', async ({ page }) => {
    await page.getByLabel(/upc.*barcode/i).fill('000000000000');
    await page.getByRole('button', { name: /lookup/i }).click();

    // Wait for lookup to complete
    await page.waitForTimeout(1500);

    await expect(page.getByText(/product not found/i)).toBeVisible();
  });

  test('should auto-fill fields on successful UPC lookup', async ({ page }) => {
    // Use the mock UPC that returns data
    await page.getByLabel(/upc.*barcode/i).fill('885909950713');
    await page.getByRole('button', { name: /lookup/i }).click();

    // Wait for lookup to complete
    await page.waitForTimeout(1500);

    // Fields should be populated
    await expect(page.getByLabel(/tool name/i)).toHaveValue(/dewalt/i);
    await expect(page.getByLabel(/brand/i)).toHaveValue(/dewalt/i);
  });

  test('should update character count in description', async ({ page }) => {
    const description = page.getByLabel(/description/i);
    await description.fill('This is a test description');

    await expect(page.getByText(/26\/1000/)).toBeVisible();
  });
});
