import { readFile, writeFile } from 'node:fs/promises';
import { extname, resolve } from 'node:path';
import { chromium } from '@playwright/test';

const sourcePath = resolve(process.argv[2] ?? '');
const outputPath = resolve(process.argv[3] ?? '');
if (!sourcePath || !outputPath) throw new Error('Usage: tsx scripts/compose-level06-wetland.ts <source.webp> <output.png>');

const source = (await readFile(sourcePath)).toString('base64');
const sourceMime = extname(sourcePath).toLowerCase() === '.png' ? 'image/png' : 'image/webp';
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setContent(`<img id="wetland" src="data:${sourceMime};base64,${source}">`);
  await page.waitForFunction(() => {
    const image = document.querySelector<HTMLImageElement>('#wetland');
    return Boolean(image?.complete && image.naturalWidth > 0);
  });
  const dataUrl = await page.evaluate(`(() => {
    const image = document.querySelector('#wetland');
    const width = 1108; const height = 842; const radius = 42; const horizontal = Math.sqrt(3) * radius;
    const originX = (width - 7.5 * horizontal) / 2 + horizontal / 2;
    const originY = (height - (13 * 1.5 + .5) * radius) / 2 + radius;
    const cells = [3, 4, 5, 6, 7, 8].map((row) => ({
      x: originX + 3 * horizontal + (row % 2 ? horizontal / 2 : 0),
      y: originY + row * 1.5 * radius,
    }));
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    const context = canvas.getContext('2d');
    const mask = document.createElement('canvas'); mask.width = width; mask.height = height;
    const maskContext = mask.getContext('2d');
    // This smooth ribbon follows the exact centers of the six non-playable cells.
    // It deliberately avoids rendering the playable-grid geometry as visible tile borders.
    maskContext.filter = 'blur(4.5px)';
    maskContext.beginPath(); maskContext.moveTo(cells[0].x, cells[0].y);
    for (const cell of cells.slice(1)) maskContext.lineTo(cell.x, cell.y);
    maskContext.strokeStyle = '#fff'; maskContext.lineWidth = radius * 1.48;
    maskContext.lineCap = 'round'; maskContext.lineJoin = 'round'; maskContext.stroke();
    maskContext.filter = 'none';
    context.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 430, 165, 260, 435);
    context.globalCompositeOperation = 'destination-in'; context.drawImage(mask, 0, 0);
    return canvas.toDataURL('image/png');
  })()`);
  await writeFile(outputPath, Buffer.from(dataUrl.slice(dataUrl.indexOf(',') + 1), 'base64'));
} finally {
  await browser.close();
}
