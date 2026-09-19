import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173';
const outputDirectory = resolve(process.argv[3] ?? 'docs/qa/campaign-menu');
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ headless: true });
try {
  for (const viewport of [
    { name: 'desktop-1440x900', width: 1440, height: 900, deviceScaleFactor: 1 },
    { name: 'mobile-390x844', width: 390, height: 844, deviceScaleFactor: 2 },
  ]) {
    const page = await browser.newPage({
      viewport: { width: viewport.width, height: viewport.height },
      deviceScaleFactor: viewport.deviceScaleFactor,
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    await page.locator('#campaignMenu.show').waitFor();
    await page.screenshot({ path: resolve(outputDirectory, `${viewport.name}.png`), fullPage: true });
    await page.locator('.atlasBody').screenshot({ path: resolve(outputDirectory, `${viewport.name}-atlas.png`) });
    await page.close();
  }
} finally {
  await browser.close();
}

console.log(outputDirectory);
