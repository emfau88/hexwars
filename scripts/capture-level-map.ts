import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const levelNumber = Number(process.argv[2] ?? 2);
if (!Number.isInteger(levelNumber) || levelNumber < 1 || levelNumber > 10) {
  throw new Error('Expected a campaign level number from 1 to 10.');
}

const baseUrl = process.argv[3] ?? 'http://127.0.0.1:5173';
const outputDirectory = resolve(process.argv[4] ?? `docs/qa/level-${String(levelNumber).padStart(2, '0')}-runtime`);
await mkdir(outputDirectory, { recursive: true });

async function saveCanvasLayer(page: import('@playwright/test').Page, path: string): Promise<void> {
  const dataUrl = await page.locator('.environmentCanvas').evaluate((canvas) => (canvas as HTMLCanvasElement).toDataURL('image/png'));
  await writeFile(path, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
}

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { name: 'desktop-1440x900', width: 1440, height: 900, deviceScaleFactor: 1 },
    { name: 'mobile-390x844', width: 390, height: 844, deviceScaleFactor: 2 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
      reducedMotion: 'no-preference',
    });
    await page.goto(`${baseUrl}/?unlock=1&autostart=1&level=${levelNumber - 1}`, { waitUntil: 'networkidle' });
    await page.waitForFunction((expected) => window.__HEXFRONT__?.getState().currentLevel === expected, levelNumber - 1);
    await page.evaluate(() => window.__HEXFRONT__?.setOpponentEnabled(false));
    await page.waitForFunction(() => {
      const profile = window.__HEXFRONT__?.getRenderProfile();
      return profile?.mapArt.loaded && profile.mapArt.loadedWaterFrames === profile.mapArt.waterFrames;
    });
    await page.screenshot({ path: resolve(outputDirectory, `${viewport.name}-water-a.png`), fullPage: true });
    await saveCanvasLayer(page, resolve(outputDirectory, `${viewport.name}-environment-a.png`));
    await page.waitForTimeout(3500);
    await page.screenshot({ path: resolve(outputDirectory, `${viewport.name}-water-b.png`), fullPage: true });
    await saveCanvasLayer(page, resolve(outputDirectory, `${viewport.name}-environment-b.png`));
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(outputDirectory);
