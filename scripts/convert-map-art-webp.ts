import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const sourcePath = resolve(process.argv[2] ?? '');
const outputPath = resolve(process.argv[3] ?? '');
const quality = Number(process.argv[4] ?? .92);

if (!sourcePath || !outputPath || !Number.isFinite(quality) || quality <= 0 || quality > 1) {
  throw new Error('Usage: tsx scripts/convert-map-art-webp.ts <source> <output.webp> [quality 0..1]');
}

const mime = extname(sourcePath).toLowerCase() === '.png' ? 'image/png' : 'image/jpeg';
const source = `data:${mime};base64,${(await readFile(sourcePath)).toString('base64')}`;
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage();
  await page.setContent(`<img id="source" src="${source}">`);
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('#source');
    return Boolean(image?.complete && image.naturalWidth > 0);
  });
  const dataUrl = await page.locator('#source').evaluate((node, webpQuality) => {
    const image = node as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    canvas.getContext('2d')?.drawImage(image, 0, 0);
    return canvas.toDataURL('image/webp', webpQuality);
  }, quality);
  await writeFile(outputPath, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
} finally {
  await browser.close();
}

console.log(outputPath);
