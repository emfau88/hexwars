import { expect, test } from '@playwright/test';

test('an existing nine-mission save unlocks the ice finale and retains campaign completion', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('hexfront_campaign_progress_v2', JSON.stringify({
    completed: Array(9).fill(true), best: Array(9).fill(60),
  })));
  await page.reload();
  await expect(page.locator('#progressCount')).toHaveText('9 / 10');
  await page.getByRole('button', { name: 'Level 10: THE RING' }).click();
  await expect(page.locator('#playLevelBtn')).toBeEnabled();
  await page.locator('#playLevelBtn').click();
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().currentLevel)).toBe(9);
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getRenderProfile().mapArt.loaded)).toBe(true);
  await page.evaluate(() => window.__HEXFRONT__!.debugWin());
  await expect(page.locator('#resultAdvanceLabel')).toHaveText('CAMPAIGN COMPLETE');
  await expect(page.locator('#campaignTotals')).toContainText('10/10 missions completed');
  await expect(page.locator('#nextLevelBtn')).toBeHidden();
  await page.locator('#resultCampaignSummary summary').click();
  await expect(page.locator('#campaignBestTimes li')).toHaveCount(10);
  await page.locator('#mapBtn').click();
  await page.reload();
  await expect(page.locator('#progressCount')).toHaveText('10 / 10');
  await expect(page.getByRole('button', { name: /Level 10: THE RING/ })).toBeEnabled();
});

test('tap commands, supply preference and a real pause work on either layout', async ({ page }) => {
  await page.goto('/?unlock=1&autostart=1&level=2');
  await expect(page.locator('#battleBar')).toBeVisible();
  await page.evaluate(() => window.__HEXFRONT__!.setOpponentEnabled(false));
  const canvas = await page.locator('#gameCanvas').boundingBox();
  const points = await page.evaluate(() => window.__HEXFRONT__!.getBoard());
  const source = points.find(h => h.col === 3 && h.row === 11)!;
  const target = points.find(h => h.col === 3 && h.row === 10)!;
  await page.mouse.click(canvas!.x + source.x, canvas!.y + source.y);
  await expect(page.locator('#holdField')).toBeEnabled();
  await page.locator('#holdField').click();
  await expect(page.locator('#holdField')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#battleSupply').click();
  await expect(page.locator('#battleSupply')).toHaveAttribute('aria-pressed', 'false');
  await page.mouse.click(canvas!.x + target.x, canvas!.y + target.y);
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().actions)).toBe(1);
  await page.locator('#pauseButton').click();
  const time = await page.evaluate(() => window.__HEXFRONT__!.getState().elapsed);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => window.__HEXFRONT__!.getState().elapsed)).toBe(time);
  await page.locator('#resumeButton').click();
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().elapsed)).toBeGreaterThan(time);
  await page.reload();
  await expect(page.locator('#battleSupply')).toHaveAttribute('aria-pressed', 'false');
});

test('blocked storage permits starting and completing a language change', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.addInitScript(() => Object.defineProperty(window, 'localStorage', {
    get() { throw new DOMException('Blocked', 'SecurityError'); },
  }));
  await page.goto('/?unlock=1&autostart=1&level=2');
  await expect(page.locator('#storageWarning')).toBeVisible();
  await page.locator('#pauseButton').click();
  await page.locator('#pauseLanguage').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#resumeButton')).toHaveText('FORTSETZEN');
  await page.locator('#resumeButton').click();
  await expect(page.locator('#battleBar')).toBeVisible();
  expect(errors).toEqual([]);
});

test('keyboard selects a source, sends and cancels; blur preserves a paused game', async ({ page }) => {
  await page.goto('/?unlock=1&autostart=1&level=2');
  await expect(page.locator('#battleBar')).toBeVisible();
  await page.evaluate(() => window.__HEXFRONT__!.setOpponentEnabled(false));
  await page.locator('#gameCanvas').focus();
  await page.keyboard.press('Home'); await page.keyboard.press('Enter');
  await expect(page.locator('#holdField')).toBeEnabled();
  await page.keyboard.press('Escape');
  await expect(page.locator('#holdField')).toBeDisabled();
  await expect(page.locator('#pauseDialog')).not.toBeVisible();
  await page.keyboard.press('Enter'); await page.keyboard.press('ArrowUp'); await page.keyboard.press('Enter');
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().actions)).toBe(1);
  await page.evaluate(() => window.dispatchEvent(new Event('blur')));
  await expect(page.locator('#pauseDialog')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().running)).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#pauseDialog')).not.toBeVisible();
});
