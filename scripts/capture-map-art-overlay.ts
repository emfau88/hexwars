import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { REFERENCE_WORLD_HEIGHT, REFERENCE_WORLD_WIDTH } from '../src/rendering/WorldGeometry';

const artPath = resolve(process.argv[2] ?? 'public/assets/maps/level02-core-v5.png');
const guidePath = resolve(process.argv[3] ?? 'docs/qa/bulk-8a-level02-visual-poc/level02-exact-art-guide.png');
const outputPath = resolve(process.argv[4] ?? 'docs/qa/bulk-8a-level02-visual-poc/level02-core-v5-guide-overlay.png');
const dataUrl = async (path: string) => `data:image/png;base64,${(await readFile(path)).toString('base64')}`;
const [art, guide] = await Promise.all([dataUrl(artPath), dataUrl(guidePath)]);

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT }, deviceScaleFactor: 1 });
  await page.setContent(`<style>
    * { box-sizing: border-box; }
    html, body { margin: 0; width: 100%; height: 100%; overflow: hidden; background: #111; }
    img { position: absolute; inset: 0; width: 100%; height: 100%; }
    #art { object-fit: cover; }
    #guide { opacity: .48; mix-blend-mode: multiply; }
  </style><img id="art" src="${art}"><img id="guide" src="${guide}">`);
  await page.waitForFunction(() => [...document.images].every((image) => image.complete && image.naturalWidth > 0));
  await page.screenshot({ path: outputPath });
} finally {
  await browser.close();
}

console.log(outputPath);
