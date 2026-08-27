import { expect, test, type Page } from '@playwright/test';

type DebugBoard = Array<{ col: number; row: number; owner: number; units: number; terrain: number; x: number; y: number }>;

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
  await expect(page.getByRole('button', { name: 'Level 1: THE PATH' })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Level 2: TWO ROUTES/ })).toHaveAttribute('aria-label', /locked/);
  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  await page.evaluate(() => window.__HEXFRONT__?.setOpponentEnabled(false));
  await expect(page.locator('#sidePanel .modeBtn[data-mode="half"]')).toBeEnabled();
  await expect(page.locator('#sidePanel .modeBtn[data-mode="all"]')).toBeDisabled();
  await expect(page.locator('#sidePanel .modeBtn[data-mode="group"]')).toBeDisabled();
  await expect(page.locator('#sidePanel .modeBtn[data-mode="all"]')).toHaveAttribute('data-unlock-label', 'FROM II');
  await expect(page.locator('#sidePanel .modeBtn[data-mode="group"]')).toHaveAttribute('data-unlock-label', 'FROM VI');
  await expect(page.locator('#unlockPanel')).toContainText('The 100% send unlocks in Mission II.');
  await page.waitForTimeout(3_800);
  await expect(page.locator('#hint')).toHaveCSS('opacity', '1');

  const board = await page.evaluate(() => window.__HEXFRONT__?.getBoard()) as DebugBoard;
  const source = board.find((hex) => hex.col === 3 && hex.row === 9)!;
  const target = board.find((hex) => hex.col === 3 && hex.row === 8)!;
  await dragBetween(page, source, target);
  await expect(page.locator('#actionStatus')).toHaveText('1');
  await expect(page.locator('#hint')).toHaveCSS('opacity', '0');
  await expect.poll(async () => page.locator('#captureStatus').textContent()).toBe('1');
});

test('enemy acts and a completed mission persists its unlock after reload', async ({ page }) => {
  await page.goto('/?autostart=1&level=0&speed=20');
  await expect.poll(async () => {
    const board = await page.evaluate(() => window.__HEXFRONT__?.getBoard()) as DebugBoard;
    const enemyBase = board.find((hex) => hex.owner === 2 && hex.terrain === 4);
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
  await expect(page.locator('#verdict')).toHaveText('VICTORY');
  await expect(page.locator('#resultKicker')).toHaveText('MAP COMPLETE');
  await expect(page.locator('.resultStats')).toBeVisible();
  await expect(page.locator('#resultAdvanceName')).toContainText('TWO ROUTES');
  await expect(page.getByRole('button', { name: 'NEXT MAP', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'CAMPAIGN MAP', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Level 2: TWO ROUTES' })).toBeEnabled();
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Level 2: TWO ROUTES' })).toBeEnabled();
  await expect(page.getByText('1 / 10', { exact: true })).toBeVisible();
});

test('manual long-range reinforcement and contextual front focus use canvas input', async ({ page }) => {
  await page.goto('/?autostart=1&level=0');
  await page.evaluate(() => {
    const api = window.__HEXFRONT__!; api.setOpponentEnabled(false);
    for (const targetRow of [8, 7]) {
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const board = api.getBoard();
        if (board.find((hex) => hex.col === 3 && hex.row === targetRow)?.owner === 1) break;
        const source = board.find((hex) => hex.col === 3 && hex.row === targetRow + 1 && hex.owner === 1);
        if (source && source.units >= 2) api.send(source.col, source.row, 3, targetRow, .9);
        api.simulate(5, .05);
      }
    }
    api.simulate(12, .05);
  });
  const before = await page.evaluate(() => window.__HEXFRONT__!.getBoard()) as DebugBoard;
  const source = before.find((hex) => hex.col === 3 && hex.row === 9)!;
  const target = before.find((hex) => hex.col === 3 && hex.row === 7)!;
  expect(target.owner).toBe(1);
  await dragBetween(page, source, target);
  await expect(page.locator('#actionStatus')).toHaveText('1');
  await expect.poll(async () => {
    const board = await page.evaluate(() => window.__HEXFRONT__!.getBoard()) as DebugBoard;
    return board.find((hex) => hex.col === 3 && hex.row === 9)?.units ?? source.units;
  }).toBeLessThan(source.units);

  await page.goto('/?autostart=1&level=5');
  const levelSix = await page.evaluate(() => window.__HEXFRONT__!.getBoard()) as DebugBoard;
  const base = levelSix.find((hex) => hex.col === 3 && hex.row === 11)!;
  const box = await page.locator('#gameCanvas').boundingBox();
  if (!box) throw new Error('Canvas is not visible.');
  await page.mouse.click(box.x + base.x, box.y + base.y);
  await expect(page.locator('#toast')).toHaveText('Supply focus set.');
});

test('all ten campaign levels start with a valid board in this viewport', async ({ page }) => {
  for (let level = 0; level < 10; level += 1) {
    await page.goto(`/?unlock=1&autostart=1&level=${level}`);
    await expect(page.locator('#headerLevel')).toContainText(`LEVEL ${level + 1}`);
    const state = await page.evaluate(() => ({ state: window.__HEXFRONT__?.getState(), board: window.__HEXFRONT__?.getBoard() }));
    expect(state.state?.running).toBe(true);
    expect(state.board?.filter((hex) => hex.terrain !== 5).length).toBeGreaterThan(2);
  }
});

test('responsive shell has no page overflow and mobile controls meet the touch floor', async ({ page }) => {
  await page.goto('/');
  const launchMetrics = await page.evaluate(() => {
    const objective = document.querySelector<HTMLElement>('.launchObjective')!.getBoundingClientRect();
    const cta = document.querySelector<HTMLElement>('#playLevelBtn')!.getBoundingClientRect();
    const preview = document.querySelector<HTMLElement>('#levelPreviewFrame')!.getBoundingClientRect();
    return { objectiveTop:objective.top, ctaTop:cta.top, ctaBottom:cta.bottom, previewTop:preview.top, viewportHeight:innerHeight };
  });
  expect(launchMetrics.objectiveTop).toBeLessThan(launchMetrics.ctaTop);
  expect(launchMetrics.ctaTop).toBeLessThan(launchMetrics.previewTop);
  expect(launchMetrics.ctaBottom).toBeLessThanOrEqual(launchMetrics.viewportHeight);
  await page.getByRole('button', { name: 'Menu settings' }).click();
  await expect(page.locator('#menuSettingsPanel')).toBeVisible();
  if ((page.viewportSize()?.width ?? 901) <= 900) {
    await expect(page.locator('#menuFullscreenBtn')).toBeVisible();
    await expect(page.locator('#menuFullscreenBtn')).toHaveText('FULLSCREEN');
  } else await expect(page.locator('#menuFullscreenBtn')).toBeHidden();
  await page.getByRole('button', { name: 'Menu settings' }).click();
  const menuMetrics = await page.evaluate(() => ({
    viewport: innerWidth,
    body: document.body.scrollWidth,
    mobile: matchMedia('(max-width:900px), (max-height:620px)').matches,
    atlasNodes: [...document.querySelectorAll<HTMLButtonElement>('.mapNode')]
      .map((button) => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
    topControls: [...document.querySelectorAll<HTMLButtonElement>('.campaignTop button')]
      .filter((button) => getComputedStyle(button).display !== 'none')
      .map((button) => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
  }));
  expect(menuMetrics.body).toBeLessThanOrEqual(menuMetrics.viewport);
  if (menuMetrics.mobile) {
    expect(Math.min(...menuMetrics.topControls.map(({ width }) => width))).toBeGreaterThanOrEqual(44);
    expect(Math.min(...menuMetrics.topControls.map(({ height }) => height))).toBeGreaterThanOrEqual(44);
    expect(Math.min(...menuMetrics.atlasNodes.map(({ width }) => width))).toBeGreaterThanOrEqual(44);
    expect(Math.min(...menuMetrics.atlasNodes.map(({ height }) => height))).toBeGreaterThanOrEqual(44);
  }
  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  const gameMetrics = await page.evaluate(() => ({
    viewport: innerWidth,
    body: document.body.scrollWidth,
    mobile: matchMedia('(max-width:900px), (max-height:520px)').matches,
    controls: [...document.querySelectorAll<HTMLButtonElement>('#mobileBar button')]
      .filter((button) => getComputedStyle(button).display !== 'none')
      .map((button) => ({ width: button.getBoundingClientRect().width, height: button.getBoundingClientRect().height })),
    statLabels: [...document.querySelectorAll<HTMLElement>('.mobileStatLabel')]
      .map((label) => ({ display: getComputedStyle(label).display, text: label.textContent })),
    radius: (() => {
      const board = window.__HEXFRONT__?.getBoard() ?? [];
      const upper = board.find((hex) => hex.col === 3 && hex.row === 8);
      const lower = board.find((hex) => hex.col === 3 && hex.row === 9);
      return upper && lower ? Math.abs(lower.y - upper.y) / 1.5 : 0;
    })(),
    stageBackground: getComputedStyle(document.querySelector<HTMLElement>('#stage')!).backgroundColor,
  }));
  expect(gameMetrics.body).toBeLessThanOrEqual(gameMetrics.viewport);
  expect(gameMetrics.stageBackground).toBe('rgb(208, 222, 193)');
  if (gameMetrics.mobile) {
    expect(Math.min(...gameMetrics.controls.map(({ width }) => width))).toBeGreaterThanOrEqual(44);
    expect(Math.min(...gameMetrics.controls.map(({ height }) => height))).toBeGreaterThanOrEqual(44);
    expect(gameMetrics.statLabels.every(({ display }) => display !== 'none')).toBe(true);
    expect(gameMetrics.statLabels.map(({ text }) => text)).toEqual(['CELLS / UNITS', 'CELLS / UNITS']);
    expect(gameMetrics.radius).toBeLessThanOrEqual(31);
  } else expect(gameMetrics.radius).toBeGreaterThan(34);
});

test('compact desktop keeps the full dossier controls visible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.setViewportSize({ width: 1100, height: 700 });
  await clearProgress(page);
  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  const metrics = await page.evaluate(() => {
    const dossier = document.querySelector<HTMLElement>('.sideDossier')!;
    const sound = document.querySelector<HTMLElement>('#sideSoundBtn')!.getBoundingClientRect();
    return {
      dossierClientHeight:dossier.clientHeight,
      dossierScrollHeight:dossier.scrollHeight,
      soundBottom:sound.bottom,
      viewportHeight:innerHeight,
      pageWidth:document.documentElement.scrollWidth,
      viewportWidth:innerWidth,
    };
  });
  expect(metrics.dossierScrollHeight).toBeLessThanOrEqual(metrics.dossierClientHeight + 2);
  expect(metrics.soundBottom).toBeLessThanOrEqual(metrics.viewportHeight);
  expect(metrics.pageWidth).toBeLessThanOrEqual(metrics.viewportWidth);
});

test('language defaults to English and the German choice survives reload', async ({ page }) => {
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#campaignTitle')).toHaveText('SELECT MAP');
  await page.getByRole('button', { name: 'Menu settings' }).click();
  await page.getByRole('button', { name: 'German' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('#campaignTitle')).toHaveText('KARTE WÄHLEN');
  await expect(page.getByRole('button', { name: 'Level 1: DER PFAD' })).toBeEnabled();

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.getByRole('button', { name: 'Level 1: DER PFAD' })).toBeEnabled();
  await page.getByRole('button', { name: 'Menüoptionen' }).click();
  await page.getByRole('button', { name: 'Englisch' }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('#campaignTitle')).toHaveText('SELECT MAP');
});

test('audio cues load, play on interaction and remember the sound preference', async ({ page }) => {
  await page.addInitScript(() => {
    const trackedWindow = window as Window & { __playedAudio?: string[] };
    trackedWindow.__playedAudio = [];
    HTMLMediaElement.prototype.play = function play(): Promise<void> {
      trackedWindow.__playedAudio?.push(new URL(this.src).pathname.split('/').pop() ?? '');
      return Promise.resolve();
    };
  });
  await page.reload();

  const assets = ['ui-confirm.mp3', 'ui-navigate.mp3', 'ui-denied.mp3', 'ui-toggle.mp3', 'send.mp3', 'capture.mp3', 'result-victory.ogg', 'result-defeat.ogg'];
  const responses = await page.evaluate(async (names) => Promise.all(names.map(async (name) => {
    const response = await fetch(`./assets/audio/${name}`);
    return { name, ok:response.ok, bytes:(await response.arrayBuffer()).byteLength };
  })), assets);
  expect(responses.every(({ ok, bytes }) => ok && bytes > 1_000)).toBe(true);
  const decoded = await page.evaluate(async (names) => Promise.all(names.map((name) => new Promise<boolean>((resolve) => {
    const audio = new Audio(`./assets/audio/${name}`);
    audio.addEventListener('loadedmetadata', () => resolve(audio.duration > 0), { once:true });
    audio.addEventListener('error', () => resolve(false), { once:true });
    audio.load();
  }))), assets);
  expect(decoded.every(Boolean)).toBe(true);

  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  await expect.poll(async () => page.evaluate(() => (window as Window & { __playedAudio?: string[] }).__playedAudio ?? [])).toContain('ui-confirm.mp3');
  await page.evaluate(() => window.__HEXFRONT__?.showMap());
  await page.getByRole('button', { name: 'Menu settings' }).click();
  await page.locator('#soundBtn').click();
  await expect(page.locator('#soundBtn')).toHaveText('SOUND OFF');
  await expect.poll(async () => page.evaluate(() => localStorage.getItem('hexfront:sound-enabled'))).toBe('off');

  await page.reload();
  await page.getByRole('button', { name: 'Menu settings' }).click();
  await expect(page.locator('#soundBtn')).toHaveText('SOUND OFF');
});

test('decor variants decode their lazily loaded candidate assets', async ({ page }) => {
  for (const visual of ['decor-p1', 'decor-p2', 'decor-v2']) {
    const assetSet = visual === 'decor-v2' ? 'decor-v2' : 'decor-p1';
    await page.goto(`/?autostart=1&level=8&visual=${visual}`);
    await expect.poll(async () => page.evaluate((set) => performance.getEntriesByType('resource')
      .filter((entry) => entry.name.includes(`/assets/${set}/`)).length, assetSet)).toBeGreaterThan(0);
    const assetUrls = await page.evaluate((set) => performance.getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => name.includes(`/assets/${set}/`)), assetSet);
    const decoded = await page.evaluate(async (urls) => Promise.all(urls.map((url) => new Promise<boolean>((resolve) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image.naturalWidth > 0 && image.naturalHeight > 0), { once: true });
      image.addEventListener('error', () => resolve(false), { once: true });
      image.src = url;
    }))), assetUrls);
    expect(assetUrls.filter((_url, index) => !decoded[index])).toEqual([]);
    const canvas = await page.locator('#gameCanvas').evaluate((element) => ({
      width: (element as HTMLCanvasElement).width,
      height: (element as HTMLCanvasElement).height,
    }));
    expect(canvas.width).toBeGreaterThan(0);
    expect(canvas.height).toBeGreaterThan(0);
  }
});
