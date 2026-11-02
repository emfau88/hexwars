import { expect, test } from '@playwright/test';

test('victory preloads the next map and continuing reports pending loading immediately', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  let requests = 0;
  await page.route('**/assets/maps/level02-core-v5.png', async route => { requests++; await gate; await route.continue(); });
  await page.goto('/?autostart=1&level=0');
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().running)).toBe(true);
  expect(requests).toBe(0);
  await page.evaluate(() => window.__HEXFRONT__!.debugWin());
  await expect(page.locator('#resultOverlay')).toHaveClass(/show/);
  await expect.poll(() => requests).toBe(1);
  await page.locator('#nextLevelBtn').click();
  await expect(page.locator('#nextLevelBtn')).toHaveText('LOADING MAP…');
  await expect(page.locator('#nextLevelBtn')).toBeDisabled();
  await expect(page.locator('#nextLevelBtn')).toHaveAttribute('aria-busy', 'true');
  await expect(page.locator('#retryBtn')).toBeDisabled();
  expect(await page.evaluate(() => window.__HEXFRONT__!.getState().currentLevel)).toBe(0);
  release();
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().currentLevel)).toBe(1);
  await expect(page.locator('#resultOverlay')).not.toHaveClass(/show/);
  expect(requests).toBe(1);
});

test('a prepared next map starts without another image request', async ({ page }) => {
  let requests = 0;
  await page.route('**/assets/maps/level02-*', route => { requests++; return route.continue(); });
  await page.goto('/?autostart=1&level=0');
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().running)).toBe(true);
  await page.evaluate(() => window.__HEXFRONT__!.debugWin());
  await expect.poll(() => page.evaluate(() => performance.getEntriesByType('resource')
    .filter(entry => entry.name.includes('/assets/maps/level02-') && entry.duration > 0).length)).toBe(3);
  await page.route('**/assets/maps/level02-*', route => { requests++; return route.abort(); });
  await page.locator('#nextLevelBtn').click();
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().currentLevel)).toBe(1);
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getRenderProfile().mapArt.loaded)).toBe(true);
  expect(requests).toBe(3);
});

test('returning to the campaign cancels a pending next-level start', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>(resolve => { release = resolve; });
  await page.route('**/assets/maps/level02-core-v5.png', async route => { await gate; await route.continue(); });
  await page.goto('/?autostart=1&level=0');
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().running)).toBe(true);
  await page.evaluate(() => window.__HEXFRONT__!.debugWin());
  await page.locator('#nextLevelBtn').click();
  await expect(page.locator('#nextLevelBtn')).toBeDisabled();
  await page.locator('#mapBtn').click();
  const response = page.waitForResponse('**/assets/maps/level02-core-v5.png');
  release(); await response; await page.waitForTimeout(300);
  await expect(page.locator('#campaignMenu')).toHaveClass(/show/);
  const state = await page.evaluate(() => window.__HEXFRONT__!.getState());
  expect(state.currentLevel).toBe(0); expect(state.running).toBe(false);
  await expect(page.locator('#playLevelBtn')).toBeEnabled();
});

for (const style of ['auto', 'modern']) test(`failed next-map artwork remains recoverable in ${style} style`, async ({ page }) => {
  await page.route('**/assets/maps/level02-core-v5.png', route => route.abort());
  await page.goto(`/?autostart=1&level=0&mapStyle=${style}`);
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().running)).toBe(true);
  await page.evaluate(() => window.__HEXFRONT__!.debugWin());
  await page.locator('#nextLevelBtn').click();
  if (style === 'auto') {
    await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().currentLevel)).toBe(1);
    expect(await page.evaluate(() => window.__HEXFRONT__!.getRenderProfile().mapArt.activeStyle)).toBe('classic');
  } else {
    await expect(page.locator('#resultLoadStatus')).toBeVisible();
    await expect(page.locator('#resultLoadStatus')).toContainText('could not be loaded');
    await expect(page.locator('#nextLevelBtn')).toBeEnabled();
    await expect(page.locator('#retryBtn')).toBeEnabled();
    await expect(page.locator('#nextLevelBtn')).toHaveAttribute('aria-busy', 'false');
    await page.locator('#retryBtn').click();
    await expect(page.locator('#resultOverlay')).not.toHaveClass(/show/);
    await expect.poll(() => page.evaluate(() => window.__HEXFRONT__!.getState().running)).toBe(true);
  }
});
