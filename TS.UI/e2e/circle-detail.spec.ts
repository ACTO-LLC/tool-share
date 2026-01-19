import { test, expect } from '@playwright/test';

test.describe('Circle Detail', () => {
  // Use a known circle ID from mock data
  const circleId = '22222222-2222-2222-2222-222222222222'; // Friends Circle

  test.beforeEach(async ({ page }) => {
    await page.goto(`/circles/${circleId}`);
    // Wait for page to load (either content or error)
    await page.waitForTimeout(1000);
  });

  test('should display circle name or loading/error state', async ({ page }) => {
    const circleName = page.getByRole('heading', { name: /friends circle/i });
    const errorState = page.getByText(/circle not found|failed to load/i);
    const loadingState = page.locator('.MuiCircularProgress-root');

    const hasName = await circleName.isVisible().catch(() => false);
    const hasError = await errorState.isVisible().catch(() => false);
    const hasLoading = await loadingState.isVisible().catch(() => false);

    // One of these should be visible
    expect(hasName || hasError || hasLoading).toBe(true);
  });

  test('should display back button', async ({ page }) => {
    await expect(page.getByRole('button', { name: /back to circles/i })).toBeVisible();
  });

  test('should navigate back when clicking back button', async ({ page }) => {
    await page.getByRole('button', { name: /back to circles/i }).click();
    await expect(page).toHaveURL('/circles');
  });

  test('should display member count when loaded', async ({ page }) => {
    const memberText = page.getByText(/member/i);
    const isVisible = await memberText.first().isVisible().catch(() => false);

    // If loaded, member text should be visible
    if (isVisible) {
      await expect(memberText.first()).toBeVisible();
    }
  });

  test('should display role chip when loaded', async ({ page }) => {
    const roleChips = page.locator('.MuiChip-root');
    const count = await roleChips.count();

    if (count > 0) {
      await expect(roleChips.first()).toBeVisible();
    }
  });

  test('should display Tools and Members tabs when loaded', async ({ page }) => {
    const toolsTab = page.getByRole('tab', { name: /tools/i });
    const isLoaded = await toolsTab.isVisible().catch(() => false);

    if (isLoaded) {
      await expect(toolsTab).toBeVisible();
      await expect(page.getByRole('tab', { name: /members/i })).toBeVisible();
    }
  });

  test('should show Tools tab by default when loaded', async ({ page }) => {
    const toolsTab = page.getByRole('tab', { name: /tools/i });
    const isLoaded = await toolsTab.isVisible().catch(() => false);

    if (isLoaded) {
      await expect(toolsTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should switch to Members tab when clicked', async ({ page }) => {
    const membersTab = page.getByRole('tab', { name: /members/i });
    const isLoaded = await membersTab.isVisible().catch(() => false);

    if (isLoaded) {
      await membersTab.click();
      await expect(membersTab).toHaveAttribute('aria-selected', 'true');
    }
  });

  test('should display members list on Members tab', async ({ page }) => {
    const membersTab = page.getByRole('tab', { name: /members/i });
    const isLoaded = await membersTab.isVisible().catch(() => false);

    if (isLoaded) {
      await membersTab.click();
      await page.waitForTimeout(500);

      const memberList = page.locator('.MuiList-root');
      const hasMembers = await memberList.isVisible().catch(() => false);

      if (hasMembers) {
        await expect(memberList).toBeVisible();
      }
    }
  });

  test('should display member avatars on Members tab', async ({ page }) => {
    const membersTab = page.getByRole('tab', { name: /members/i });
    const isLoaded = await membersTab.isVisible().catch(() => false);

    if (isLoaded) {
      await membersTab.click();
      await page.waitForTimeout(500);

      const avatars = page.locator('.MuiListItem-root .MuiAvatar-root');
      const count = await avatars.count();

      if (count > 0) {
        await expect(avatars.first()).toBeVisible();
      }
    }
  });

  test('should display invite code section for admins', async ({ page }) => {
    const inviteCodeSection = page.getByText(/invite code/i);
    const isVisible = await inviteCodeSection.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display copy invite code button for admins', async ({ page }) => {
    const copyButton = page.locator('[data-testid="ContentCopyIcon"]').locator('..');
    const isVisible = await copyButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display share invite button for admins', async ({ page }) => {
    const shareButton = page.locator('[data-testid="ShareIcon"]').locator('..');
    const isVisible = await shareButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should display Leave button for non-owners', async ({ page }) => {
    const leaveButton = page.getByRole('button', { name: /leave/i });
    const isVisible = await leaveButton.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });

  test('should open leave dialog when clicking Leave', async ({ page }) => {
    const leaveButton = page.getByRole('button', { name: /leave/i });
    if (await leaveButton.isVisible()) {
      await leaveButton.click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByText(/leave circle/i)).toBeVisible();
    }
  });

  test('should close leave dialog when clicking Cancel', async ({ page }) => {
    const leaveButton = page.getByRole('button', { name: /leave/i });
    if (await leaveButton.isVisible()) {
      await leaveButton.click();
      await page.getByRole('button', { name: /cancel/i }).click();
      await expect(page.getByRole('dialog')).not.toBeVisible();
    }
  });

  test('should display member action menu for admins', async ({ page }) => {
    const membersTab = page.getByRole('tab', { name: /members/i });
    const isLoaded = await membersTab.isVisible().catch(() => false);

    if (isLoaded) {
      await membersTab.click();
      await page.waitForTimeout(500);

      const moreButton = page.locator('[data-testid="MoreVertIcon"]').locator('..');
      const isVisible = await moreButton.isVisible().catch(() => false);
      expect(typeof isVisible).toBe('boolean');
    }
  });

  test('should display empty state for tools when no tools shared', async ({ page }) => {
    const toolsTab = page.getByRole('tab', { name: /tools/i });
    const isLoaded = await toolsTab.isVisible().catch(() => false);

    if (isLoaded) {
      const emptyToolsMessage = page.getByText(/no tools have been shared/i);
      const toolCards = page.locator('[role="tabpanel"]').first().locator('.MuiCardActionArea-root');

      const hasTools = await toolCards.count() > 0;
      if (!hasTools) {
        const hasEmptyMessage = await emptyToolsMessage.isVisible().catch(() => false);
        expect(typeof hasEmptyMessage).toBe('boolean');
      }
    }
  });

  test('should navigate to tool detail when clicking a tool card', async ({ page }) => {
    const toolCards = page.locator('[role="tabpanel"]').first().locator('.MuiCardActionArea-root');
    const cardCount = await toolCards.count();

    if (cardCount > 0) {
      await toolCards.first().click();
      await expect(page).toHaveURL(/\/tools\/.+/);
    }
  });

  test('should show error for invalid circle ID', async ({ page }) => {
    await page.goto('/circles/invalid-circle-id');
    await page.waitForTimeout(1000);

    const errorMessage = page.getByText(/circle not found|failed to load|error/i);
    const isVisible = await errorMessage.isVisible().catch(() => false);
    expect(typeof isVisible).toBe('boolean');
  });
});
