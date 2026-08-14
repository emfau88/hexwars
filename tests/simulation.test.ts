import assert from 'node:assert/strict';
import test from 'node:test';
import { GAME_CONFIG, ENEMY_BASE } from '../src/core/config';
import { GameState } from '../src/core/GameState';
import { createSeededRandom } from '../src/core/random';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { buildLevel } from '../src/levels/buildLevel';
import { CampaignProgressStore } from '../src/persistence/CampaignProgressStore';
import { updateCombat } from '../src/systems/CombatSystem';
import { updateGrowth } from '../src/systems/GrowthSystem';
import { evaluateVictory } from '../src/systems/VictorySystem';

const positionFor = (col: number, row: number) => ({ x: col * 100 + (row % 2 ? 50 : 0), y: row * 100 });
const makeHex = (overrides: Partial<HexState> = {}): HexState => ({
  col: 0, row: 0, x: 0, y: 0, owner: Owner.Player, units: 10,
  terrain: Terrain.Normal, decor: null, siege: null, flash: 0, fixedUnits: null,
  ...overrides,
});

test('seeded level generation is deterministic and different seeds diverge', () => {
  const first = buildLevel(4, createSeededRandom(505)).map(({ col, row, units, terrain, decor }) => ({ col, row, units, terrain, decor }));
  const second = buildLevel(4, createSeededRandom(505)).map(({ col, row, units, terrain, decor }) => ({ col, row, units, terrain, decor }));
  const other = buildLevel(4, createSeededRandom(506)).map(({ units }) => units);
  assert.deepEqual(first, second);
  assert.notDeepEqual(first.map(({ units }) => units), other);
});

test('growth respects terrain regeneration and capacity', () => {
  const hex = makeHex({ units: 10 });
  updateGrowth([hex], 0, 10);
  assert.equal(hex.units, 14.2);
  hex.units = GAME_CONFIG.baseCap;
  updateGrowth([hex], 0, 10);
  assert.equal(hex.units, GAME_CONFIG.baseCap);
});

test('50 and 100 percent commands remove the correct amount', () => {
  const halfState = new GameState(); halfState.start(1, positionFor);
  const halfSource = halfState.hexAt(3, 11)!; const halfTarget = halfState.hexAt(3, 10)!;
  assert.equal(halfState.sendFraction(halfSource, halfTarget, .5), true);
  assert.equal(halfSource.units, 12);
  assert.equal(halfState.armies[0].units, 11);

  const allState = new GameState(); allState.start(1, positionFor);
  const allSource = allState.hexAt(3, 11)!; const allTarget = allState.hexAt(3, 10)!;
  assert.equal(allState.sendFraction(allSource, allTarget, 1), true);
  assert.equal(allSource.units, 0);
  assert.equal(allState.armies[0].units, 23);
});

test('movement takes physical time before arrival', () => {
  const state = new GameState(); state.start(0, positionFor);
  const source = state.hexAt(3, 9)!; const target = state.hexAt(3, 8)!;
  state.send(source, target, Owner.Player, 10);
  const travelTime = Math.hypot(target.x - source.x, target.y - source.y) / GAME_CONFIG.travelSpeed;
  state.update(travelTime * .9);
  assert.equal(state.armies.length, 1);
  assert.equal(target.siege, null);
  state.update(travelTime * .2);
  assert.equal(state.armies.length, 0);
  assert.equal(target.siege?.[Owner.Player], 10);
});

test('combat reduces defenders and captures with remaining attackers', () => {
  const target = makeHex({ owner: Owner.Neutral, units: 2, siege: { [Owner.Player]: 8 } });
  let capture: { old: Owner; next: Owner } | null = null;
  updateCombat([target], 1, () => .5, (_hex, old, next) => { capture = { old, next }; });
  assert.deepEqual(capture, { old: Owner.Neutral, next: Owner.Player });
  assert.equal(target.owner, Owner.Player);
  assert.ok(target.units >= 1);
});

test('capturing the enemy base yields victory', () => {
  const state = new GameState(); state.start(0, positionFor);
  const enemyBase = state.hexAt(ENEMY_BASE.col, ENEMY_BASE.row)!;
  enemyBase.owner = Owner.Player;
  assert.deepEqual(evaluateVictory(state.hexes, state.armies), { result: 'victory', reason: 'enemyBaseCaptured' });
});

test('AI issues a legal action from its initial position', () => {
  const state = new GameState(); state.start(0, positionFor);
  const sent = state.think(Owner.Enemy, .9);
  assert.ok(sent > 0);
  assert.equal(state.armies.length, 1);
  assert.equal(state.armies[0].owner, Owner.Enemy);
});

class MemoryStorage implements Storage {
  private values = new Map<string, string>();
  get length() { return this.values.size; }
  clear() { this.values.clear(); }
  getItem(key: string) { return this.values.get(key) ?? null; }
  key(index: number) { return [...this.values.keys()][index] ?? null; }
  removeItem(key: string) { this.values.delete(key); }
  setItem(key: string, value: string) { this.values.set(key, value); }
}

test('progress unlocks sequentially and survives a reload', () => {
  const storage = new MemoryStorage(); const store = new CampaignProgressStore(storage);
  let progress = store.load();
  assert.equal(store.isUnlocked(progress, 0), true);
  assert.equal(store.isUnlocked(progress, 1), false);
  progress = store.complete(progress, 0, 72.5);
  assert.equal(store.isUnlocked(progress, 1), true);
  const reloaded = new CampaignProgressStore(storage).load();
  assert.equal(reloaded.completed[0], true);
  assert.equal(reloaded.best[0], 72.5);
});
