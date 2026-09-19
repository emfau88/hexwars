import assert from 'node:assert/strict';
import test from 'node:test';
import { Terrain, type HexState } from '../src/core/types';
import { exposedWaterShoreEdges, fitSpriteSize } from '../src/rendering/LandscapeRenderer';
import { centeredAspectCrop, LEVEL_EIGHT_MAP_ART, LEVEL_FIVE_MAP_ART, LEVEL_FOUR_MAP_ART, LEVEL_ONE_MAP_ART, LEVEL_SEVEN_MAP_ART, LEVEL_SIX_MAP_ART, LEVEL_THREE_MAP_ART, LEVEL_TWO_MAP_ART, mapArtForLevel } from '../src/rendering/MapArtManifest';
import { MAP_ART_RENDER_LAYERS } from '../src/rendering/MapArtRenderer';

const water = (col: number, row: number): HexState => ({
  col, row, x: 0, y: 0, owner: 0, units: 0, terrain: Terrain.Decor, decor: 'water',
  siege: null, flash: 0, fixedUnits: null,
});

test('shore geometry omits shared edges between connected water cells', () => {
  assert.equal(exposedWaterShoreEdges([water(0, 0)]).length, 6);
  assert.equal(exposedWaterShoreEdges([water(0, 0), water(1, 0)]).length, 10);
  assert.equal(exposedWaterShoreEdges([water(0, 0), water(0, 1)]).length, 10);
});

test('Level 1 water block forms one shoreline instead of eight outlined hexes', () => {
  const block = [4, 5, 6, 7].flatMap((row) => [water(0, row), water(1, row)]);
  assert.equal(exposedWaterShoreEdges(block).length, 22);
});

test('tall tree sprites are height-fitted before drawing inside a hex', () => {
  const fitted = fitSpriteSize(36, 2, 31 * 1.25);
  assert.equal(fitted.height, 38.75);
  assert.equal(fitted.width, 19.375);
});

test('Level 1 map art uses one centered uniform crop for the canonical world', () => {
  const crop = centeredAspectCrop(
    LEVEL_ONE_MAP_ART.core.sourceWidth,
    LEVEL_ONE_MAP_ART.core.sourceHeight,
    LEVEL_ONE_MAP_ART.worldRect.width,
    LEVEL_ONE_MAP_ART.worldRect.height,
  );
  assert.ok(Math.abs(crop.width / crop.height - LEVEL_ONE_MAP_ART.worldRect.width / LEVEL_ONE_MAP_ART.worldRect.height) < 1e-10);
  assert.equal(crop.x, 0);
  assert.ok(crop.y > 0 && crop.y < .2);
  assert.equal(LEVEL_ONE_MAP_ART.worldRect.width, 1108);
  assert.equal(LEVEL_ONE_MAP_ART.worldRect.height, 842);
});

test('Level 2 map art keeps the same canonical world and supplies two asset water states', () => {
  assert.equal(mapArtForLevel(1), LEVEL_TWO_MAP_ART);
  assert.equal(LEVEL_TWO_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_TWO_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.equal(LEVEL_TWO_MAP_ART.waterFrames.length, 2);
  assert.deepEqual(
    LEVEL_TWO_MAP_ART.structureSafeAreas.filter(({ kind }) => kind === 'hq').map(({ col, row }) => [col, row]),
    [[3, 1], [3, 11]],
  );
});

test('Level 3 map art is a static core with clear HQ safe areas', () => {
  assert.equal(mapArtForLevel(2), LEVEL_THREE_MAP_ART);
  assert.equal(LEVEL_THREE_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_THREE_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.equal('waterFrames' in LEVEL_THREE_MAP_ART, false);
  assert.deepEqual(
    LEVEL_THREE_MAP_ART.structureSafeAreas.map(({ col, row }) => [col, row]),
    [[3, 1], [3, 11]],
  );
});

test('Level 4 map art is a static highland core with stable HQ geometry', () => {
  assert.equal(mapArtForLevel(3), LEVEL_FOUR_MAP_ART);
  assert.equal(LEVEL_FOUR_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_FOUR_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.equal('waterFrames' in LEVEL_FOUR_MAP_ART, false);
  assert.deepEqual(
    LEVEL_FOUR_MAP_ART.structureSafeAreas.map(({ col, row }) => [col, row]),
    [[3, 1], [3, 11]],
  );
});

test('Level 5 map art reserves both HQs and both guardian stations', () => {
  assert.equal(mapArtForLevel(4), LEVEL_FIVE_MAP_ART);
  assert.equal(LEVEL_FIVE_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_FIVE_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.equal('waterFrames' in LEVEL_FIVE_MAP_ART, false);
  assert.deepEqual(LEVEL_FIVE_MAP_ART.landscapeOverlays, [{
    source: './assets/maps/level05-central-massif-v1.webp',
    sourceWidth: 1024,
    sourceHeight: 1536,
    worldRect: { x: 418, y: 235, width: 241, height: 371 },
  }]);
  assert.deepEqual(
    LEVEL_FIVE_MAP_ART.structureSafeAreas.map(({ kind, col, row }) => [kind, col, row]),
    [['hq', 3, 1], ['guardian', 1, 4], ['guardian', 5, 4], ['hq', 3, 11]],
  );
});

test('Level 6 map art reserves the two corridors and maps its wetland barrier to six decor cells', () => {
  assert.equal(mapArtForLevel(5), LEVEL_SIX_MAP_ART);
  assert.equal(LEVEL_SIX_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_SIX_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.deepEqual(LEVEL_SIX_MAP_ART.landscapeOverlays, [{
    source: './assets/maps/level06-central-wetland-v3.webp',
    sourceWidth: 1108,
    sourceHeight: 842,
    worldRect: { x: 0, y: 0, width: 1108, height: 842 },
  }]);
  assert.deepEqual(
    LEVEL_SIX_MAP_ART.structureSafeAreas.map(({ kind, col, row }) => [kind, col, row]),
    [['hq', 3, 1], ['guardian', 2, 4], ['hq', 3, 11]],
  );
});

test('Level 7 map art keeps its relay island and both headquarters clear', () => {
  assert.equal(mapArtForLevel(6), LEVEL_SEVEN_MAP_ART);
  assert.equal(LEVEL_SEVEN_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_SEVEN_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.equal('landscapeOverlays' in LEVEL_SEVEN_MAP_ART, false);
  assert.deepEqual(
    LEVEL_SEVEN_MAP_ART.structureSafeAreas.map(({ kind, col, row }) => [kind, col, row]),
    [['hq', 3, 1], ['relay', 3, 6], ['hq', 3, 11]],
  );
});

test('Level 8 map art reserves its two relays, central hill, and both headquarters', () => {
  assert.equal(mapArtForLevel(7), LEVEL_EIGHT_MAP_ART);
  assert.equal(LEVEL_EIGHT_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.width);
  assert.equal(LEVEL_EIGHT_MAP_ART.worldRect.height, LEVEL_ONE_MAP_ART.worldRect.height);
  assert.equal('landscapeOverlays' in LEVEL_EIGHT_MAP_ART, false);
  assert.deepEqual(
    LEVEL_EIGHT_MAP_ART.structureSafeAreas.map(({ kind, col, row }) => [kind, col, row]),
    [['hq', 3, 1], ['relay', 1, 6], ['hill', 3, 6], ['relay', 5, 6], ['hq', 3, 11]],
  );
});

test('map-art render layers keep atmosphere below all gameplay information', () => {
  const grid = MAP_ART_RENDER_LAYERS.indexOf('grid');
  const territory = MAP_ART_RENDER_LAYERS.indexOf('territory-selection');
  const structures = MAP_ART_RENDER_LAYERS.indexOf('structures');
  const units = MAP_ART_RENDER_LAYERS.indexOf('units-movement');
  const atmosphere = MAP_ART_RENDER_LAYERS.indexOf('atmosphere');
  assert.ok(atmosphere > MAP_ART_RENDER_LAYERS.indexOf('shore'));
  assert.ok(grid > atmosphere);
  assert.ok(territory > grid);
  assert.ok(structures > territory);
  assert.ok(units > structures);
  assert.ok(MAP_ART_RENDER_LAYERS.indexOf('gameplay-fx') > units);
});
