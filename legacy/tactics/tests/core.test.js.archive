import test from "node:test";
import assert from "node:assert/strict";
import {
  advanceFire,
  chooseAdvanceHex,
  createHexBoard,
  getReachableHexes,
  hexDistance,
  hexKey,
  igniteTile,
} from "../src/core.js";

test("a radius-four board contains 61 hexes", () => {
  assert.equal(createHexBoard(4).size, 61);
});

test("hex distance works across axial coordinates", () => {
  assert.equal(hexDistance({ q: -4, r: 0 }, { q: 4, r: 0 }), 8);
  assert.equal(hexDistance({ q: 0, r: 0 }, { q: 1, r: -1 }), 1);
});

test("movement avoids water and occupied cells", () => {
  const board = createHexBoard(2, { [hexKey(1, 0)]: "water" });
  const blocked = new Set([hexKey(0, 1)]);
  const reachable = getReachableHexes(board, { q: 0, r: 0 }, 1, blocked);
  assert.equal(reachable.has(hexKey(1, 0)), false);
  assert.equal(reachable.has(hexKey(0, 1)), false);
  assert.equal(reachable.size, 4);
});

test("AI advance chooses a traversable hex closer to its target", () => {
  const board = createHexBoard(3, { [hexKey(-1, 0)]: "water" });
  const start = { q: 0, r: 0 };
  const target = { q: -3, r: 0 };
  const choice = chooseAdvanceHex(board, start, [target], 2);
  assert.ok(choice);
  assert.equal(hexDistance(choice, target), 2);
  assert.notEqual(hexKey(choice), hexKey(-1, 0));
});

test("fire damages occupants, spreads to forest, and cannot ignite water", () => {
  const board = createHexBoard(2, {
    [hexKey(0, 0)]: "forest",
    [hexKey(1, 0)]: "forest",
    [hexKey(-1, 0)]: "water",
  });
  const units = [{ id: "unit", q: 0, r: 0, hp: 3 }];
  assert.equal(igniteTile(board, { q: 0, r: 0 }), true);
  assert.equal(igniteTile(board, { q: -1, r: 0 }), false);

  const result = advanceFire(board, units);
  assert.deepEqual(result.damagedUnits, ["unit"]);
  assert.equal(units[0].hp, 2);
  assert.equal(board.get(hexKey(1, 0)).fire, 2);
});
