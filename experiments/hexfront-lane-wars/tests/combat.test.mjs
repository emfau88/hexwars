import test from 'node:test';
import assert from 'node:assert/strict';
import { Combat } from '../src/simulation.js';
import { STEP, UNITS, distance } from '../src/rules.js';

function empty() { return new Combat(); }
function robot(game, type, owner, p, options = {}) { return game.addUnit({ type, owner, p, ...options }); }
function normalized(game, swap = false) {
  return game.units.map(u => ({ owner: swap ? (u.owner === 'orange' ? 'blue' : 'orange') : u.owner, type: u.type, order: u.order, hp: u.hp, p: +(swap ? 30 - u.p : u.p).toFixed(7), x: +u.x.toFixed(7) })).sort((a, b) => a.owner.localeCompare(b.owner) || a.order - b.order);
}

test('three roles each win their intended equal-production duel', () => {
  for (const [a, b] of [['drone', 'rail'], ['mech', 'drone'], ['rail', 'mech']]) {
    const g = new Combat({ orange: { [a]: 1 }, blue: { [b]: 1 } });
    assert.equal(g.run().result, 'orange', `${a} vs ${b}`);
    assert.ok(g.stats.orange.damage > 0 && g.stats.blue.damage > 0);
  }
});

test('stationary friendly rail does not stop a mech behind it', () => {
  const g = empty();
  const mech = robot(g, 'mech', 'orange', 8, { order: 0 });
  const rail = robot(g, 'rail', 'orange', 9, { order: 1, cooldown: 100 });
  robot(g, 'mech', 'blue', 12, { cooldown: 100 });
  g.advance(3);
  assert.ok(mech.p > rail.p, 'mech passes the stationary friendly rifle');
  assert.ok(g.drainEvents().some(e => e.kind === 'shot' && e.source === mech.id));
});

test('allied front does not occlude rail shots', () => {
  const g = empty();
  const rail = robot(g, 'rail', 'orange', 8);
  robot(g, 'mech', 'orange', 9, { order: 1, cooldown: 100 });
  robot(g, 'mech', 'blue', 11, { cooldown: 100 });
  g.advance(0.5);
  assert.ok(g.drainEvents().some(e => e.kind === 'shot' && e.source === rail.id));
});

test('shots respect Euclidean range, including lateral separation', () => {
  const g = new Combat({ orange: { drone: 3, mech: 1 }, blue: { mech: 2, rail: 2 } });
  while (!g.result && g.time < 60) {
    g.step();
    for (const e of g.drainEvents().filter(e => e.kind === 'shot')) assert.ok(distance(e.from, e.to) <= UNITS[e.type].range + 1e-8);
  }
});

test('a valid target is retained when a closer enemy appears', () => {
  const g = empty();
  const a = robot(g, 'rail', 'orange', 8, { cooldown: 100 });
  const b = robot(g, 'mech', 'blue', 11, { cooldown: 100 });
  g.step();
  assert.equal(a.target, b.id);
  robot(g, 'drone', 'blue', 10, { order: 1, cooldown: 100 });
  g.step();
  assert.equal(a.target, b.id);
});

test('out-of-range targets are replaced by reachable targets', () => {
  const g = empty();
  const a = robot(g, 'rail', 'orange', 8, { cooldown: 100 });
  const b = robot(g, 'mech', 'blue', 11, { cooldown: 100 });
  g.step(); b.p = 20;
  const c = robot(g, 'drone', 'blue', 10, { order: 1, cooldown: 100 });
  g.step(); assert.equal(a.target, c.id);
});

test('shots never select targets from another lane', () => {
  const g = empty();
  robot(g, 'rail', 'orange', 10, { lane: 0 });
  robot(g, 'rail', 'blue', 11, { lane: 1 });
  g.advance(8);
  assert.equal(g.stats.orange.shots + g.stats.blue.shots, 0);
  assert.equal(g.result, null);
});

test('single-target overkill never spills to a second drone', () => {
  const g = empty();
  robot(g, 'rail', 'orange', 8);
  const a = robot(g, 'drone', 'blue', 10, { cooldown: 100 });
  const b = robot(g, 'drone', 'blue', 10.1, { x: 0.2, order: 1, cooldown: 100 });
  g.advance(0.4);
  assert.equal(a.hp, 0);
  assert.equal(b.hp, UNITS.drone.hp);
  assert.equal(g.stats.orange.damage, UNITS.drone.hp);
});

test('mech splash has a radius and a two-secondary-target limit', () => {
  const g = empty();
  robot(g, 'mech', 'orange', 8);
  const targets = [-0.4, -0.2, 0, 0.2, 0.4].map((x, order) => robot(g, 'drone', 'blue', 9, { x, order, cooldown: 100 }));
  const far = robot(g, 'drone', 'blue', 11, { order: 5, cooldown: 100 });
  g.advance(0.2);
  assert.equal(targets.filter(u => u.hp < UNITS.drone.hp).length, 3);
  assert.equal(g.stats.orange.damage, 24);
  assert.equal(far.hp, UNITS.drone.hp);
});

test('simultaneous lethal shots produce a draw', () => {
  const g = empty();
  robot(g, 'rail', 'orange', 10);
  robot(g, 'rail', 'blue', 12);
  assert.equal(g.run().result, 'draw');
  assert.equal(g.stats.orange.shots, 1);
  assert.equal(g.stats.blue.shots, 1);
});

test('advertised attack interval includes acquisition and is not shortened', () => {
  const g = empty();
  const a = robot(g, 'drone', 'orange', 8);
  robot(g, 'mech', 'blue', 9, { cooldown: 100 });
  g.advance(2);
  const shots = g.drainEvents().filter(e => e.kind === 'shot' && e.source === a.id);
  assert.ok(shots.length >= 3);
  for (let i = 1; i < shots.length; i++) assert.ok(Math.abs(shots[i].time - shots[i - 1].time - UNITS.drone.interval) < 1e-8);
});

test('units converge on laterally separated enemies instead of walking past forever', () => {
  const g = empty();
  robot(g, 'drone', 'orange', 14, { x: -1.4 });
  robot(g, 'drone', 'blue', 16, { x: 1.4 });
  assert.notEqual(g.run(20).result, 'unresolved');
});

test('same simulation duration is independent of browser frame slicing', () => {
  const options = { orange: { drone: 2, mech: 1 }, blue: { mech: 2, rail: 1 } };
  const a = new Combat(options), b = new Combat(options);
  a.advance(4);
  for (let i = 0; i < 240; i++) b.advance(1 / 60);
  assert.deepEqual(a.snapshot(), b.snapshot());
});

test('motion remains bounded by the configured unit speed', () => {
  const g = new Combat({ orange: { drone: 4, mech: 2 }, blue: { rail: 4 } });
  for (let i = 0; i < 120; i++) {
    const old = new Map(g.units.map(u => [u.id, { ...u }])); g.step();
    for (const u of g.units) assert.ok(distance(u, old.get(u.id)) <= UNITS[u.type].speed * STEP + 1e-8);
  }
});

test('reordering internal arrays does not change combat outcomes', () => {
  const options = { orange: { drone: 2, rail: 2 }, blue: { mech: 2, rail: 2 } };
  const a = new Combat(options), b = new Combat(options);
  b.units.reverse();
  assert.deepEqual(a.run(), b.run());
});

test('mirrored mixed combat preserves positions, HP and result every tick', () => {
  const a = new Combat({ orange: { drone: 3, rail: 1 }, blue: { mech: 2, rail: 2 } });
  const b = new Combat({ orange: { mech: 2, rail: 2 }, blue: { drone: 3, rail: 1 } });
  while (!a.result && a.time < 60) {
    a.step(); b.step();
    assert.deepEqual(normalized(a), normalized(b, true));
  }
});

test('Mech plus rail has a same-budget counter at three starting distances', () => {
  for (const gap of [6, 12, 18]) {
    assert.equal(new Combat({ orange: { drone: 4 }, blue: { mech: 2, rail: 2 }, gap }).run().result, 'orange');
  }
});

test('local steering is symmetric exactly at the approach threshold', () => {
  const a = new Combat({ orange: { mech: 2, rail: 2 }, blue: { drone: 3, mech: 1 }, gap: 6, spacing: 0.85 });
  const b = new Combat({ orange: { drone: 3, mech: 1 }, blue: { mech: 2, rail: 2 }, gap: 6, spacing: 0.85 });
  while (!a.result && a.time < 60) { a.step(); b.step(); assert.deepEqual(normalized(a), normalized(b, true)); }
});

test('the swarm counter itself loses to dedicated anti-swarm production', () => {
  assert.equal(new Combat({ orange: { mech: 4 }, blue: { drone: 4 } }).run().result, 'orange');
});

test('the strong three-mech mix loses to protected concentrated ranged fire', () => {
  assert.equal(new Combat({ orange: { mech: 1, rail: 3 }, blue: { mech: 3, rail: 1 } }).run().result, 'orange');
});

test('time budgets report unresolved combat, never invent a winner', () => {
  const g = new Combat({ orange: { mech: 1 }, blue: { mech: 1 }, gap: 18 });
  assert.equal(g.run(0.1).result, 'unresolved');
  assert.equal(g.result, null);
  assert.equal(g.units.length, 2);
});

test('input validation prevents NaNs, negative HP and invalid formations', () => {
  assert.throws(() => new Combat({ orange: { drone: -1 } }));
  assert.throws(() => new Combat({ gap: NaN }));
  assert.throws(() => empty().advance(Infinity));
  assert.throws(() => robot(empty(), 'mech', 'orange', NaN));
});
