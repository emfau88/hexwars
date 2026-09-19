import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateWorldGeometry,
  inverseTransformPoint,
  positionFor,
  REFERENCE_WORLD_GEOMETRY,
  transformBetween,
  transformPoint,
} from '../src/rendering/WorldGeometry';

const closeTo = (actual: number, expected: number, tolerance = 1e-9) => {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);
};

test('reference world matches the exported Level 1 art-guide geometry', () => {
  assert.equal(REFERENCE_WORLD_GEOMETRY.width, 1108);
  assert.equal(REFERENCE_WORLD_GEOMETRY.height, 842);
  closeTo(REFERENCE_WORLD_GEOMETRY.radius, 40.3);
  closeTo(REFERENCE_WORLD_GEOMETRY.center.x, 554);
  closeTo(REFERENCE_WORLD_GEOMETRY.center.y, 421);
  const playerBase = positionFor(REFERENCE_WORLD_GEOMETRY, 3, 9);
  const enemyBase = positionFor(REFERENCE_WORLD_GEOMETRY, 3, 3);
  closeTo(playerBase.x, enemyBase.x);
  closeTo(playerBase.y - enemyBase.y, 9 * REFERENCE_WORLD_GEOMETRY.radius);
});

test('one uniform transform maps every reference hex center onto runtime geometry', () => {
  for (const [width, height] of [[1366, 768], [1920, 1080], [390, 844], [768, 1024]]) {
    const runtime = calculateWorldGeometry(width, height);
    const transform = transformBetween(REFERENCE_WORLD_GEOMETRY, runtime);
    closeTo(transform.scale, runtime.radius / REFERENCE_WORLD_GEOMETRY.radius);
    for (const [col, row] of [[0, 0], [3, 3], [3, 9], [6, 12]]) {
      const mapped = transformPoint(positionFor(REFERENCE_WORLD_GEOMETRY, col, row), transform);
      const expected = positionFor(runtime, col, row);
      closeTo(mapped.x, expected.x);
      closeTo(mapped.y, expected.y);
      const roundTrip = inverseTransformPoint(mapped, transform);
      const reference = positionFor(REFERENCE_WORLD_GEOMETRY, col, row);
      closeTo(roundTrip.x, reference.x);
      closeTo(roundTrip.y, reference.y);
    }
  }
});

test('runtime board bounds stay centered without non-uniform scaling', () => {
  for (const [width, height] of [[1035, 710], [1550, 1022], [391, 718], [768, 898]]) {
    const geometry = calculateWorldGeometry(width, height);
    closeTo(geometry.center.x, width / 2);
    closeTo(geometry.center.y, height / 2);
    assert.ok(geometry.bounds.x >= 0);
    assert.ok(geometry.bounds.y >= 0);
    assert.ok(geometry.bounds.x + geometry.bounds.width <= width + 1e-9);
    assert.ok(geometry.bounds.y + geometry.bounds.height <= height + 1e-9);
  }
});
