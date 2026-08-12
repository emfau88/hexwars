import assert from 'node:assert/strict';
import test from 'node:test';
import { Terrain, type HexState } from '../src/core/types';
import { exposedWaterShoreEdges, fitSpriteSize } from '../src/rendering/LandscapeRenderer';

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
