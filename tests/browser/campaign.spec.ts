import { expect, test, type Page } from '@playwright/test';

type DebugBoard = Array<{ col: number; row: number; owner: number; units: number; terrain: number; x: number; y: number }>;
type GeometrySnapshot = {
  runtime: { width: number; height: number; radius: number; origin: { x: number; y: number }; center: { x: number; y: number }; bounds: { x: number; y: number; width: number; height: number } };
  transform: { scale: number; translateX: number; translateY: number };
};

async function readGeometry(page: Page): Promise<{ geometry: GeometrySnapshot; canvas: DOMRect; stage: DOMRect; anchor: { x: number; y: number } }> {
  await expect.poll(async () => page.evaluate(() => {
    const canvas = document.querySelector('#gameCanvas')?.getBoundingClientRect();
    const stage = document.querySelector('#stage')?.getBoundingClientRect();
    return canvas && stage ? Math.max(Math.abs(canvas.width - stage.width), Math.abs(canvas.height - stage.height)) : Infinity;
  })).toBeLessThanOrEqual(1);
  return page.evaluate(() => {
    const geometry = window.__HEXFRONT__!.getGeometry() as GeometrySnapshot;
    const canvas = document.querySelector('#gameCanvas')!.getBoundingClientRect();
    const stage = document.querySelector('#stage')!.getBoundingClientRect();
    const anchor = window.__HEXFRONT__!.getBoard().find((hex) => hex.col === 3 && hex.row === 9)!;
    return { geometry, canvas: canvas.toJSON(), stage: stage.toJSON(), anchor: { x: anchor.x, y: anchor.y } };
  });
}

function expectSameGeometry(actual: Awaited<ReturnType<typeof readGeometry>>, expected: Awaited<ReturnType<typeof readGeometry>>): void {
  for (const key of ['width', 'height', 'radius'] as const) expect(actual.geometry.runtime[key]).toBeCloseTo(expected.geometry.runtime[key], 6);
  for (const key of ['x', 'y'] as const) {
    expect(actual.geometry.runtime.origin[key]).toBeCloseTo(expected.geometry.runtime.origin[key], 6);
    expect(actual.geometry.runtime.center[key]).toBeCloseTo(expected.geometry.runtime.center[key], 6);
    expect(actual.anchor[key]).toBeCloseTo(expected.anchor[key], 6);
  }
  expect(actual.canvas.width).toBeCloseTo(actual.stage.width, 0);
  expect(actual.canvas.height).toBeCloseTo(actual.stage.height, 0);
}

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
  await expect(page.locator('#commandDock .modeBtn[data-mode="half"]')).toBeEnabled();
  await expect(page.locator('#commandDock .modeBtn[data-mode="all"]')).toBeDisabled();
  await expect(page.locator('#commandDock .modeBtn[data-mode="group"]')).toBeDisabled();
  await expect(page.locator('#commandDock .modeBtn[data-mode="all"]')).toHaveAttribute('data-unlock-label', 'LOCKED → LEVEL 2');
  await expect(page.locator('#commandDock .modeBtn[data-mode="group"]')).toHaveAttribute('data-unlock-label', 'LOCKED → LEVEL 4');
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
  await expect(page.locator('#resultAdvance')).toHaveClass(/commandUnlock/);
  await expect(page.locator('#resultUnlockVisual')).toBeVisible();
  await expect(page.locator('#resultUnlockVisual')).toContainText('100 %');
  await expect(page.locator('#resultAdvanceLabel')).toHaveText('NEW COMMAND UNLOCKED');
  await expect(page.locator('#resultAdvanceName')).toHaveText('100% SEND');
  await expect(page.locator('#resultAdvanceRule')).toContainText('The source is left empty.');
  await expect(page.getByRole('button', { name: 'CONTINUE TO LEVEL 2', exact: true })).toBeVisible();
  const unlockMetrics = await page.locator('.modalBox').evaluate((modal) => {
    const box = modal.getBoundingClientRect();
    return { top:box.top, bottom:box.bottom, viewportHeight:innerHeight, scrollHeight:modal.scrollHeight, clientHeight:modal.clientHeight };
  });
  expect(unlockMetrics.top).toBeGreaterThanOrEqual(0);
  expect(unlockMetrics.bottom).toBeLessThanOrEqual(unlockMetrics.viewportHeight);
  expect(unlockMetrics.scrollHeight).toBeLessThanOrEqual(unlockMetrics.clientHeight + 1);
  await page.getByRole('button', { name: 'CAMPAIGN MAP', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Level 2: TWO ROUTES' })).toBeEnabled();
  await page.getByRole('button', { name: 'Level 2: TWO ROUTES' }).click();
  await expect(page.locator('#menuFeatureUnlock')).toHaveText('NEW · 100% SEND');
  await expect(page.getByRole('button', { name: 'START · TRY 100% SEND' })).toBeVisible();
  await page.getByRole('button', { name: 'START · TRY 100% SEND' }).click();
  await page.evaluate(() => window.__HEXFRONT__?.setOpponentEnabled(false));
  await expect(page.locator('#app')).toHaveClass(/fullSendCoach/);
  await expect(page.locator('.modeBtn[data-mode="all"]:visible')).toHaveClass(/newlyUnlocked/);
  await expect(page.locator('#hint')).toContainText('choose 100%');
  await expect(page.locator('.modeBtn[data-mode="all"]:visible')).toHaveAttribute('data-new-label', 'NEW · 100% SEND');
  const levelTwoBoard = await page.evaluate(() => window.__HEXFRONT__?.getBoard()) as DebugBoard;
  const levelTwoSource = levelTwoBoard.find((hex) => hex.col === 3 && hex.row === 11)!;
  const levelTwoTarget = levelTwoBoard.find((hex) => hex.col === 3 && hex.row === 10)!;
  await dragBetween(page, levelTwoSource, levelTwoTarget);
  await expect(page.locator('#app')).toHaveClass(/fullSendCoach/);
  await expect(page.locator('#hint')).toHaveCSS('opacity', '1');
  await page.locator('.modeBtn[data-mode="all"]:visible').click();
  await dragBetween(page, levelTwoSource, levelTwoTarget);
  await expect(page.locator('#app')).not.toHaveClass(/fullSendCoach/);
  await expect(page.locator('#hint')).toHaveCSS('opacity', '0');
  await expect.poll(async () => page.evaluate(() => JSON.parse(localStorage.getItem('hexfront_campaign_progress_v2') ?? '{}').fullSendUsed)).toBe(true);
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Level 2: TWO ROUTES' })).toBeEnabled();
  await expect(page.getByText('1 / 10', { exact: true })).toBeVisible();
});

test('the full-send unlock is localized in German', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('hexfront_locale_v1', 'de'));
  await page.goto('/?autostart=1&level=0');
  await page.evaluate(() => window.__HEXFRONT__?.debugWin());
  await expect(page.locator('#resultAdvanceLabel')).toHaveText('NEUER BEFEHL FREIGESCHALTET');
  await expect(page.locator('#resultAdvanceName')).toHaveText('100 % SENDEN');
  await expect(page.locator('#resultAdvanceRule')).toContainText('Das Ausgangsfeld bleibt leer.');
  await expect(page.locator('#resultUnlockMode')).toHaveText('SENDEN');
  await expect(page.getByRole('button', { name: 'WEITER ZU LEVEL 2' })).toBeVisible();
});

test('group send is introduced in Level 4 with a visible coach', async ({ page }) => {
  await page.goto('/?unlock=1');
  await page.getByRole('button', { name: 'Level 4: HIGHLANDS' }).click();
  await expect(page.locator('#menuFeatureUnlock')).toHaveText('NEW · GROUP SEND');
  await page.getByRole('button', { name: 'START · TRY GROUP SEND' }).click();
  await expect(page.locator('#commandDock .modeBtn[data-mode="group"]')).toBeEnabled();
  await expect(page.locator('#app')).toHaveClass(/groupSendCoach/);
  await expect(page.locator('#hint')).toContainText('choose GROUP');
  await expect(page.locator('.modeBtn[data-mode="group"]:visible')).toHaveClass(/newlyUnlocked/);
});

test('desktop exposes keyboard shortcuts and advances straight to the next level', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/?autostart=1&level=1');
  await expect(page.locator('#commandDock .modeShortcut')).toHaveText(['1', '2', '3']);
  await page.keyboard.press('2');
  await expect(page.locator('#commandDock .modeBtn[data-mode="all"]')).toHaveClass(/active/);
  await page.keyboard.press('1');
  await expect(page.locator('#commandDock .modeBtn[data-mode="half"]')).toHaveClass(/active/);

  await page.goto('/?autostart=1&level=0');
  await page.evaluate(() => window.__HEXFRONT__?.debugWin());
  await page.getByRole('button', { name: 'CONTINUE TO LEVEL 2', exact: true }).click();
  await expect(page.locator('#campaignMenu')).not.toHaveClass(/show/);
  await expect(page.locator('#headerLevel')).toContainText('LEVEL 2');
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__?.getState().running)).toBe(true);
});

test('water rendering survives browsers without pattern transforms', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Object.defineProperty(window, 'DOMMatrix', { configurable: true, value: undefined });
    try { Object.defineProperty(CanvasPattern.prototype, 'setTransform', { configurable: true, value: undefined }); } catch { /* read-only in this browser */ }
  });
  await page.goto('/?autostart=1&level=0');
  await expect(page.locator('#gameCanvas')).toBeVisible();
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__?.getState().running)).toBe(true);
  await page.waitForTimeout(500);
  expect(errors).toEqual([]);
});

test('manual long-range reinforcement uses canvas input', async ({ page }) => {
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
});

test('all ten campaign levels start with a valid board in this viewport', async ({ page }) => {
  let firstGeometry: Awaited<ReturnType<typeof readGeometry>> | null = null;
  for (let level = 0; level < 10; level += 1) {
    await page.goto(`/?unlock=1&autostart=1&level=${level}`);
    await expect(page.locator('#headerLevel')).toContainText(`LEVEL ${level + 1}`);
    const state = await page.evaluate(() => ({ state: window.__HEXFRONT__?.getState(), board: window.__HEXFRONT__?.getBoard() }));
    expect(state.state?.running).toBe(true);
    expect(state.board?.filter((hex) => hex.terrain !== 5).length).toBeGreaterThan(2);
    const geometry = await readGeometry(page);
    if (firstGeometry) expectSameGeometry(geometry, firstGeometry);
    else firstGeometry = geometry;
  }
});

test('Level 5 exposes two active guardians and their finite HQ shield', async ({ page }, testInfo) => {
  await page.goto('/?autostart=1&level=4');
  await expect(page.locator('#legendGuardian')).not.toHaveAttribute('hidden');
  if (testInfo.project.name === 'mobile-portrait') await expect(page.locator('#hint')).toContainText('48 HQ shield');
  else await expect(page.locator('#legendGuardian')).toBeVisible();
  await expect(page.locator('#ruleText')).toContainText('48 HQ shield');
  const structures = await page.evaluate(() => window.__HEXFRONT__?.getStructures());
  const guardians = structures?.filter(({ type }) => type === 'guardian') ?? [];
  expect(guardians).toHaveLength(2);
  expect(guardians.every(({ owner, status, shield, linkedTo }) => owner === 2 && status === 'active' && shield === 48 && linkedTo === 'enemy-hq')).toBe(true);
});

test('Level 6 exposes one eastern guardian and its smaller HQ shield', async ({ page }, testInfo) => {
  await page.goto('/?unlock=1&autostart=1&level=5');
  await expect(page.locator('#legendGuardian')).not.toHaveAttribute('hidden');
  if (testInfo.project.name !== 'mobile-portrait') await expect(page.locator('#legendGuardian')).toBeVisible();
  await expect(page.locator('#ruleText')).toContainText('guardian');
  const structures = await page.evaluate(() => window.__HEXFRONT__?.getStructures());
  const guardians = structures?.filter(({ type }) => type === 'guardian') ?? [];
  expect(guardians).toHaveLength(1);
  expect(guardians[0]).toMatchObject({ id: 'enemy-guardian-east', owner: 2, col: 4, row: 4, status: 'active', shield: 36, linkedTo: 'enemy-hq' });
});

test('campaign start, restart and direct next level keep identical board geometry', async ({ page }) => {
  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  await page.evaluate(() => window.__HEXFRONT__?.setOpponentEnabled(false));
  const started = await readGeometry(page);
  await page.evaluate(() => window.__HEXFRONT__?.startLevel(0));
  const restarted = await readGeometry(page);
  expectSameGeometry(restarted, started);
  await page.evaluate(() => window.__HEXFRONT__?.startLevel(1));
  const nextLevel = await readGeometry(page);
  expectSameGeometry(nextLevel, started);
});

test('Level 1 map art shares the canonical uniform world transform with its gameplay layers', async ({ page }) => {
  await page.goto('/?autostart=1&level=0');
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__?.getRenderProfile())).toMatchObject({
    mapArt: { enabled: true, loaded: true, sourceWidth: 1438, sourceHeight: 1093 },
    targetFps: 60,
    fallbackFloorFps: 30,
  });
  const result = await page.evaluate(() => ({
    profile: window.__HEXFRONT__!.getRenderProfile(),
    geometry: window.__HEXFRONT__!.getGeometry(),
    canvas: {
      width: (document.querySelector('#gameCanvas') as HTMLCanvasElement).width,
      height: (document.querySelector('#gameCanvas') as HTMLCanvasElement).height,
    },
  }));
  const { coreScreenRect, mapArt, layers } = result.profile;
  expect(coreScreenRect.width).toBeCloseTo(1108 * result.geometry.transform.scale, 6);
  expect(coreScreenRect.height).toBeCloseTo(842 * result.geometry.transform.scale, 6);
  expect(mapArt.sourceCrop.width / mapArt.sourceCrop.height).toBeCloseTo(1108 / 842, 10);
  expect(layers).toEqual([
    'backdrop-bleed', 'map-core', 'water', 'shore', 'atmosphere', 'grid',
    'territory-selection', 'structures', 'units-movement', 'gameplay-fx',
  ]);
  expect(result.canvas.width).toBeCloseTo(result.geometry.runtime.width * result.geometry.pixelRatio, 0);
  expect(result.canvas.height).toBeCloseTo(result.geometry.runtime.height * result.geometry.pixelRatio, 0);
});

test('Level 1 core art decodes and reduced motion freezes environment phases', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/?autostart=1&level=0');
  const decoded = await page.evaluate(() => new Promise<{ width: number; height: number }>((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve({ width: image.naturalWidth, height: image.naturalHeight }), { once: true });
    image.addEventListener('error', () => reject(new Error('Level 1 map core failed to decode.')), { once: true });
    image.src = './assets/maps/level01-core-v1.png';
  }));
  expect(decoded).toEqual({ width: 1438, height: 1093 });
  await expect.poll(() => page.evaluate(() => window.__HEXFRONT__?.getRenderProfile())).toMatchObject({
    reducedMotion: true,
    environmentAnimated: false,
  });
});

test('mobile Level 1 PoC keeps render CPU inside a 60 FPS frame budget', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-portrait');
  await page.goto('/?autostart=1&level=0');
  await page.evaluate(() => window.__HEXFRONT__?.setOpponentEnabled(false));
  await page.waitForTimeout(500);
  const timing = await page.evaluate(() => window.__HEXFRONT__!.measureRenderCost(90));
  expect(timing.samples).toBe(90);
  expect(timing.averageMs).toBeLessThan(timing.frameBudgetMs);
  expect(timing.p95Ms).toBeLessThan(timing.frameBudgetMs);
});

test('an orientation cycle restores the exact portrait board geometry', async ({ page }) => {
  await page.getByRole('button', { name: 'BEGIN CAMPAIGN' }).click();
  await page.evaluate(() => window.__HEXFRONT__?.setOpponentEnabled(false));
  await page.setViewportSize({ width: 390, height: 844 });
  const portrait = await readGeometry(page);
  await page.setViewportSize({ width: 844, height: 390 });
  const landscape = await readGeometry(page);
  expect(landscape.geometry.runtime.width).toBeCloseTo(landscape.stage.width, 0);
  expect(landscape.geometry.runtime.height).toBeCloseTo(landscape.stage.height, 0);
  await page.setViewportSize({ width: 390, height: 844 });
  expectSameGeometry(await readGeometry(page), portrait);
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

test('large desktop keeps the board complete and exposes the command dock', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/?unlock=1&autostart=1&level=1');
  const metrics = await page.evaluate(() => {
    const dock = document.querySelector<HTMLElement>('#commandDock')!.getBoundingClientRect();
    const button = document.querySelector<HTMLElement>('#commandDock .modeBtn')!.getBoundingClientRect();
    const shortcut = document.querySelector<HTMLElement>('#commandDock .modeShortcut')!;
    const upper = window.__HEXFRONT__?.getBoard().find((hex) => hex.col === 3 && hex.row === 8);
    const lower = window.__HEXFRONT__?.getBoard().find((hex) => hex.col === 3 && hex.row === 9);
    return {
      dockWidth: dock.width,
      buttonHeight: button.height,
      shortcutFontSize: Number.parseFloat(getComputedStyle(shortcut).fontSize),
      guide: document.querySelector('#commandDock .modeKeyboardDiagram')?.textContent?.replace(/\s+/g, ''),
      radius: upper && lower ? Math.abs(lower.y - upper.y) / 1.5 : 0,
    };
  });
  expect(metrics.dockWidth).toBeGreaterThanOrEqual(300);
  expect(metrics.buttonHeight).toBeGreaterThanOrEqual(64);
  expect(metrics.shortcutFontSize).toBeGreaterThanOrEqual(12);
  expect(metrics.guide).toContain('1→50');
  expect(metrics.radius).toBeGreaterThanOrEqual(41);
});

test('desktop auto supply can be paused without hiding its explanation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chromium');
  await page.goto('/?unlock=1&autostart=1&level=1');
  const toggle = page.locator('#autoSupplyBtn');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#autoSupplyDescription')).toContainText('Surplus follows the forward route toward the rival');
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#autoSupplyStatus')).toHaveText('OFF · MANUAL');
  await expect(page.locator('#autoSupplyDescription')).toContainText('Your units stay put');
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
    const assetUrls = [
      `./assets/${assetSet}/mountains-snow-peaks.webp`,
      `./assets/${assetSet}/snow-snow-conifer.webp`,
      `./assets/${assetSet}/snow-snow-rocks.webp`,
    ];
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
