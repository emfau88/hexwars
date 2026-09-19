import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { createSeededRandom } from '../src/core/random';
import { Terrain } from '../src/core/types';
import { buildLevel } from '../src/levels/buildLevel';
import { LEVEL_ONE_MAP_ART } from '../src/rendering/MapArtManifest';
import { positionFor, REFERENCE_WORLD_GEOMETRY, REFERENCE_WORLD_HEIGHT, REFERENCE_WORLD_WIDTH } from '../src/rendering/WorldGeometry';

const output = resolve(process.argv[2] ?? 'docs/qa/bulk-3-level1-visual-poc/level01-exact-art-guide.svg');
const hexes = buildLevel(0, createSeededRandom(101), (col, row) => positionFor(REFERENCE_WORLD_GEOMETRY, col, row));
const radius = REFERENCE_WORLD_GEOMETRY.radius;

const points = (x: number, y: number, scale = .955) => Array.from({ length: 6 }, (_, index) => {
  const angle = (60 * index - 90) * Math.PI / 180;
  return `${(x + radius * scale * Math.cos(angle)).toFixed(2)},${(y + radius * scale * Math.sin(angle)).toFixed(2)}`;
}).join(' ');

const terrainFill = (terrain: Terrain, decor: string | null) => {
  if (terrain !== Terrain.Decor) return '#e8dfc3';
  if (decor === 'water') return '#67afc3';
  if (decor === 'forest') return '#7fa36b';
  return '#cbdcb9';
};

const cells = hexes.map((hex) => {
  const playable = hex.terrain !== Terrain.Decor;
  return `<g data-cell="${hex.col},${hex.row}" data-terrain="${playable ? Terrain[hex.terrain] : hex.decor}">
    <polygon points="${points(hex.x, hex.y)}" fill="${terrainFill(hex.terrain, hex.decor)}" fill-opacity="${playable ? .82 : .7}" stroke="#30483b" stroke-width="1.25"/>
    <text x="${hex.x}" y="${hex.y + 3}" text-anchor="middle">${hex.col},${hex.row}</text>
  </g>`;
}).join('\n');

const bases = LEVEL_ONE_MAP_ART.structureSafeAreas.map((area) => {
  const center = positionFor(REFERENCE_WORLD_GEOMETRY, area.col, area.row);
  return `<g data-safe-area="${area.kind}:${area.col},${area.row}">
    <circle cx="${center.x}" cy="${center.y}" r="${area.radius}" fill="none" stroke="${area.row < 6 ? '#2c79ad' : '#d76d32'}" stroke-width="4"/>
    <circle cx="${center.x}" cy="${center.y}" r="4" fill="#18231d"/>
  </g>`;
}).join('\n');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${REFERENCE_WORLD_WIDTH}" height="${REFERENCE_WORLD_HEIGHT}" viewBox="0 0 ${REFERENCE_WORLD_WIDTH} ${REFERENCE_WORLD_HEIGHT}">
  <rect width="100%" height="100%" fill="#cfddc1"/>
  <g font-family="ui-monospace,monospace" font-size="8" fill="#f7f4e8" stroke="none">${cells}</g>
  <g>${bases}</g>
  <rect x="12" y="10" width="${REFERENCE_WORLD_WIDTH - 24}" height="31" rx="9" fill="#18231d" fill-opacity=".9"/>
  <text x="24" y="31" font-family="ui-monospace,monospace" font-size="12" font-weight="700" fill="#f7f4e8">HEXFRONT LEVEL 1 EXACT ART GUIDE · ${REFERENCE_WORLD_WIDTH}×${REFERENCE_WORLD_HEIGHT} · 7×13 · radius ${radius.toFixed(2)}px</text>
</svg>`;

await mkdir(dirname(output), { recursive: true });
await writeFile(output, svg, 'utf8');
console.log(output);
