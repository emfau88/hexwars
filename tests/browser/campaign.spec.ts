import { expect, test, type Page } from '@playwright/test';

type DebugBoard = Array<{ col: number; row: number; owner: number; units: number; x: number; y: number }>;

async function clearProgress(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/');
}

async function dragBetween(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  const canvas = page.locator('#gameCanvas');
  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas is not visible.');
  await page.mouse.move(box.x + from.x, box.y + from.y);
  await page.mouse.down();
  await page.mouse.move(box.x + to.x, box.y + to.y, { steps: 8 });
  await page.mouse.up();
}

test.beforeEach(async ({ page }) => clearProgress(page));

test('campaign map, unlock state and real pointer drag work', async ({ page }) => {
  await expect(page.getByText('0 / 10', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Level 1: DER PFAD' })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Level 2: ZWEI WEGE/ })).toHaveAttribute('aria-label', /gesperrt/);
  await page.getByRole('button', { name: 'KAMPAGNE BEGINNEN' }).click();
  await expect(page.locator('#sidePanel .modeBtn[data-mode="half"]')).toBeEnabled();
  await expect(page.locator('#sidePanel .modeBtn[data-mode="all"]')).toBeDisabled();
  await expect(page.locator('#sidePanel .modeBtn[data-mode="group"]')).toBeDisabled();

  const board = await page.evaluate(() => window.__HEXFRONT__?.getBoard()) as DebugBoard;
  const source = board.find((hex) => hex.col === 3 && hex.row === 11)!;
  const target = board.find((hex) => hex.col === 3 && hex.row === 10)!;
  await dragBetween(page, source, target);
  await expect(page.locator('#actionStatus')).toHaveText('1');
  await expect.poll(async () => page.locator('#captureStatus').textContent()).toBe('1');
});

test('enemy acts and a completed mission persists its unlock after reload', async ({ page }) => {
  await page.goto('/?autostart=1&level=0&speed=20');
  await expect.poll(async () => {
    const board = await page.evaluate(() => window.__HEXFRONT__?.getBoard()) as DebugBoard;
    const enemyBase = board.find((hex) => hex.col === 3 && hex.row === 1);
    return enemyBase?.units ?? 23;
  }).toBeLessThan(23);

  await page.reload();
  await page.evaluate(() => {
    window.__HEXFRONT__?.startLevel(0);
    window.__HEXFRONT__?.setOpponentEnabled(false);
  });
  await expect.poll(async () => page.evaluate(() => {
    const api = window.__HEXFRONT__;
    if (!api) return 'missing';
    for (let wave = 0; wave < 80 && api.getState().running; wave += 1) {
      const board = api.getBoard();
      for (let row = 11; row >= 2; row -= 1) {
        const source = board.find((hex) => hex.col === 3 && hex.row === row && hex.owner === 1 && hex.units >= 2);
        const target = board.find((hex) => hex.col === 3 && hex.row === row - 1 && hex.terrain !== 5);
        if (source && target) api.send(source.col, source.row, target.col, target.row, .9);
      }
      api.simulate(4, .05);
    }
    return api.getState().result;
  }), { timeout: 12_000 }).toBe('victory');
  await expect(page.locator('#verdict')).toHaveText('SIEG');
  await page.getByRole('button', { name: 'KAMPAGNENKARTE' }).click();
  await expect(page.getByRole('button', { name: 'Level 2: ZWEI WEGE' })).toBeEnabled();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Level 2: ZWEI WEGE' })).toBeEnabled();
  await expect(page.getByText('1 / 10', { exact: true })).toBeVisible();
});
