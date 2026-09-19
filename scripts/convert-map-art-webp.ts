import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const sourcePath = resolve(process.argv[2] ?? '');
const outputPath = resolve(process.argv[3] ?? '');
const quality = Number(process.argv[4] ?? .92);
const outputWidth = Number(process.argv[5] ?? 0);
const outputHeight = Number(process.argv[6] ?? 0);

if (
  !sourcePath ||
  !outputPath ||
  !Number.isFinite(quality) ||
  quality <= 0 ||
  quality > 1 ||
  !Number.isInteger(outputWidth) ||
  !Number.isInteger(outputHeight) ||
  outputWidth < 0 ||
  outputHeight < 0 ||
  Boolean(outputWidth) !== Boolean(outputHeight)
) {
  throw new Error('Usage: tsx scripts/convert-map-art-webp.ts <source> <output.webp> [quality 0..1] [width height]');
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
  const dataUrl = await page.locator('#source').evaluate((node, options) => {
    const image = node as HTMLImageElement;
    const canvas = document.createElement('canvas');
    canvas.width = options.width || image.naturalWidth;
    canvas.height = options.height || image.naturalHeight;
    const sourceAspect = image.naturalWidth / image.naturalHeight;
    const targetAspect = canvas.width / canvas.height;
    const sourceWidth = sourceAspect > targetAspect ? image.naturalHeight * targetAspect : image.naturalWidth;
    const sourceHeight = sourceAspect > targetAspect ? image.naturalHeight : image.naturalWidth / targetAspect;
    const sourceX = (image.naturalWidth - sourceWidth) / 2;
    const sourceY = (image.naturalHeight - sourceHeight) / 2;
    canvas.getContext('2d')?.drawImage(image, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/webp', options.quality);
  }, { quality, width: outputWidth, height: outputHeight });
  await writeFile(outputPath, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
} finally {
  await browser.close();
}

console.log(outputPath);
