import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { chromium } from '@playwright/test';
import { ENEMY_BASE, PLAYER_BASE } from '../src/core/config';
import { createSeededRandom } from '../src/core/random';
import { Owner, Terrain } from '../src/core/types';
import { buildLevel } from '../src/levels/buildLevel';
import { LEVELS } from '../src/levels';
import { positionFor, REFERENCE_WORLD_GEOMETRY, REFERENCE_WORLD_HEIGHT, REFERENCE_WORLD_WIDTH } from '../src/rendering/WorldGeometry';

const requestedLevel = Number(process.argv[2] ?? 1);
if (!Number.isInteger(requestedLevel) || requestedLevel < 1 || requestedLevel > LEVELS.length) {
  throw new Error(`Expected a level number from 1 to ${LEVELS.length}.`);
}

const levelIndex = requestedLevel - 1;
const level = LEVELS[levelIndex];
const levelSlug = `level${String(requestedLevel).padStart(2, '0')}`;
const outputDirectory = resolve(process.argv[3] ?? `docs/qa/bulk-8a-${levelSlug}-visual-poc`);
const svgPath = join(outputDirectory, `${levelSlug}-exact-art-guide.svg`);
const pngPath = join(outputDirectory, `${levelSlug}-exact-art-guide.png`);
const hexes = buildLevel(levelIndex, createSeededRandom(level.seed), (col, row) => positionFor(REFERENCE_WORLD_GEOMETRY, col, row));
const radius = REFERENCE_WORLD_GEOMETRY.radius;

const points = (x: number, y: number, scale = .955) => Array.from({ length: 6 }, (_, index) => {
  const angle = (60 * index - 90) * Math.PI / 180;
  return `${(x + radius * scale * Math.cos(angle)).toFixed(2)},${(y + radius * scale * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

const terrainFill = (terrain: Terrain, decor: string | null) => {
  if (terrain === Terrain.Base) return '#e9d5ae';
  if (terrain === Terrain.Relay) return '#d5c0e4';
  if (terrain === Terrain.Hill) return '#c7b59a';
  if (terrain !== Terrain.Decor) return '#e8dfc3';
  if (decor === 'water') return '#57a9c2';
  if (decor === 'forest') return '#698d60';
  if (decor === 'mountain') return '#9b958b';
  if (decor === 'marsh') return '#81966c';
  if (decor === 'snow') return '#d9e3df';
  if (decor === 'ruin') return '#ad9d84';
  return '#cbdcb9';
};

const cells = hexes.map((hex) => {
  const playable = hex.terrain !== Terrain.Decor;
  const semantic = playable ? Terrain[hex.terrain] : hex.decor;
  return `<g data-cell="${hex.col},${hex.row}" data-terrain="${semantic}" data-playable="${playable}">
    <polygon points="${points(hex.x, hex.y)}" fill="${terrainFill(hex.terrain, hex.decor)}" fill-opacity="${playable ? .86 : .76}" stroke="${playable ? '#263d33' : '#496355'}" stroke-width="${playable ? 1.5 : 1}"/>
    <rect x="${hex.x - 14}" y="${hex.y - 7}" width="28" height="14" rx="4" fill="#17231e" fill-opacity=".58"/>
    <text x="${hex.x}" y="${hex.y + 3}" text-anchor="middle">${hex.col},${hex.row}</text>
  </g>`;
}).join('\n');

const bases = level.bases ?? { player: PLAYER_BASE, enemy: ENEMY_BASE };
const safeAreas = [
  { kind: 'enemy-hq', owner: Owner.Enemy, ...bases.enemy, radius: 35 },
  { kind: 'player-hq', owner: Owner.Player, ...bases.player, radius: 35 },
  ...(level.structures ?? []).map((structure) => ({
    kind: structure.type, owner: structure.owner ?? Owner.Neutral,
    col: structure.col, row: structure.row, radius: radius * (structure.footprint ?? .78),
  })),
];

const safeAreaMarkup = safeAreas.map((area) => {
  const center = positionFor(REFERENCE_WORLD_GEOMETRY, area.col, area.row);
  const color = area.owner === Owner.Player ? '#e9782d' : area.owner === Owner.Enemy ? '#2b83bf' : '#d8c16e';
  return `<g data-safe-area="${area.kind}:${area.col},${area.row}">
    <circle cx="${center.x}" cy="${center.y}" r="${area.radius}" fill="${color}" fill-opacity=".13" stroke="${color}" stroke-width="4"/>
    <circle cx="${center.x}" cy="${center.y}" r="4" fill="#17231e"/>
    <text x="${center.x}" y="${center.y + area.radius + 12}" text-anchor="middle" class="safe-label">${area.kind}</text>
  </g>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${REFERENCE_WORLD_WIDTH}" height="${REFERENCE_WORLD_HEIGHT}" viewBox="0 0 ${REFERENCE_WORLD_WIDTH} ${REFERENCE_WORLD_HEIGHT}">
  <rect width="100%" height="100%" fill="#cddcc0"/>
  <style>
    text { font-family: ui-monospace, SFMono-Regular, Consolas, monospace; font-size: 8px; fill: #f7f4e8; }
    .safe-label { font-size: 9px; font-weight: 800; fill: #17231e; paint-order: stroke; stroke: #f5ecd4; stroke-width: 2px; }
  </style>
  <g>${cells}</g>
  <g>${safeAreaMarkup}</g>
  <rect x="12" y="10" width="${REFERENCE_WORLD_WIDTH - 24}" height="31" rx="9" fill="#18231d" fill-opacity=".92"/>
  <text x="24" y="31" font-size="12" font-weight="700">HEXFRONT ${levelSlug.toUpperCase()} EXACT ART GUIDE · ${REFERENCE_WORLD_WIDTH}×${REFERENCE_WORLD_HEIGHT} · ${level.cols}×${level.rows} · radius ${radius.toFixed(2)}px</text>
</svg>`;

await mkdir(outputDirectory, { recursive: true });
await writeFile(svgPath, svg, 'utf8');

const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage({ viewport: { width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT }, deviceScaleFactor: 1 });
  await page.setContent(svg);
  await page.locator('svg').screenshot({ path: pngPath });
} finally {
  await browser.close();
}

console.log(svgPath);
console.log(pngPath);
