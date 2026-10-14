import { STEP, LENGTH, HALF_WIDTH, OWNERS, TYPES, UNITS, other, direction, distance, clamp } from './rules.js';

/** Pure fixed-step simulation. No DOM, renderer, clock, network, or Math.random. */
export class Combat {
  constructor({ orange = {}, blue = {}, gap = 12, spacing = 0.72, lane = 0 } = {}) {
    this.time = 0;
    this.tick = 0;
    this.remainder = 0;
    this.result = null;
    this.units = [];
    this.events = [];
    this.serial = 0;
    this.stats = Object.fromEntries(OWNERS.map(owner => [owner, { initial: 0, initialHP: 0, damage: 0, shots: 0, lost: 0 }]));
    if (!Number.isFinite(gap) || gap < 2 || gap > 22) throw new RangeError('Gap must be between 2 and 22.');
    if (!Number.isFinite(spacing) || spacing < 0.45 || spacing > 0.9) throw new RangeError('Invalid spacing.');
    this.addArmy('orange', orange, { gap, spacing, lane });
    this.addArmy('blue', blue, { gap, spacing, lane });
    this.resolveResult();
  }

  addArmy(owner, army, { gap, spacing, lane }) {
    let row = 0;
    let order = 0;
    for (const type of ['mech', 'drone', 'rail']) {
      const batches = army[type] ?? 0;
      if (!Number.isInteger(batches) || batches < 0 || batches > 12) throw new RangeError('Choose 0–12 batches of each type.');
      const count = batches * UNITS[type].count;
      for (let i = 0; i < count; i++) {
        const rowCount = Math.min(3, count - Math.floor(i / 3) * 3);
        const x = (i % 3 - (rowCount - 1) / 2) * spacing;
        const p = LENGTH / 2 - gap / 2 - (row + Math.floor(i / 3)) * 0.85;
        this.addUnit({ type, owner, p: owner === 'orange' ? p : LENGTH - p, x, lane, order: order++ });
      }
      row += Math.ceil(count / 3);
    }
  }

  addUnit({ type, owner, p, x = 0, lane = 0, hp = UNITS[type]?.hp, cooldown = 0, order = null }) {
    if (!UNITS[type] || !OWNERS.includes(owner) || ![p, x, hp, cooldown].every(Number.isFinite) || hp <= 0 || hp > UNITS[type].hp || cooldown < 0 || !Number.isInteger(lane)) throw new TypeError('Invalid unit.');
    const u = { id: ++this.serial, order: order ?? this.stats[owner].initial, type, owner, lane, p, x, homeX: x, hp, cooldown, target: null, aiming: null, aimTime: 0, moving: false };
    this.units.push(u);
    this.stats[owner].initial++;
    this.stats[owner].initialHP += hp;
    this.result = null;
    return u;
  }

  chooseTarget(unit, snapshot) {
    const spec = UNITS[unit.type];
    const inRange = snapshot.filter(v => v.owner !== unit.owner && v.lane === unit.lane && distance(unit, v) <= spec.range + 1e-9);
    return inRange.find(v => v.id === unit.target) || inRange.sort((a, b) => this.compareDistance(unit, a, b))[0] || null;
  }

  compareDistance(origin, a, b) {
    const difference = distance(origin, a) - distance(origin, b);
    return Math.abs(difference) > 1e-8 ? difference : a.order - b.order;
  }

  move(unit, snapshot, engaged) {
    const spec = UNITS[unit.type];
    const dir = direction(unit.owner);
    let dp = engaged ? 0 : dir * spec.speed * STEP;
    let dx = (unit.homeX - unit.x) * 0.18 * STEP;
    const nearest = snapshot.filter(v => v.owner !== unit.owner && v.lane === unit.lane).sort((a, b) => this.compareDistance(unit, a, b))[0];
    if (!engaged && nearest && Math.abs(nearest.p - unit.p) <= spec.range + 2 + 1e-9) {
      // Local steering closes lateral gaps, including an enemy that has just passed.
      // It is not a lane change or a special flank ability.
      const d = distance(unit, nearest);
      dp = (nearest.p - unit.p) / d * spec.speed * STEP;
      dx = (nearest.x - unit.x) / d * spec.speed * STEP;
    }
    for (const v of snapshot) {
      if (v.id === unit.id || v.lane !== unit.lane) continue;
      if (v.owner !== unit.owner) continue;
      const wanted = spec.radius + UNITS[v.type].radius + 0.06;
      const d = distance(unit, v);
      if (d < wanted && Math.abs(unit.p - v.p) < wanted) {
        const sign = Math.abs(unit.x - v.x) > 1e-7 ? Math.sign(unit.x - v.x) : (unit.order < v.order ? -1 : 1);
        dx += sign * (wanted - d) * 2 * STEP;
      }
    }
    const length = Math.hypot(dp, dx);
    if (length > spec.speed * STEP) { dp *= spec.speed * STEP / length; dx *= spec.speed * STEP / length; }
    return { p: unit.p + dp, x: clamp(unit.x + dx, -HALF_WIDTH, HALF_WIDTH) };
  }

  step() {
    if (this.result) return;
    const snapshot = this.units.map(u => ({ ...u }));
    const hits = new Map();
    const shots = [];
    const hit = (target, damage, owner) => {
      if (!hits.has(target.id)) hits.set(target.id, []);
      hits.get(target.id).push({ damage, owner });
    };
    for (const u of this.units) {
      const spec = UNITS[u.type];
      const before = snapshot.find(v => v.id === u.id);
      const target = this.chooseTarget(before, snapshot);
      const position = this.move(before, snapshot, !!target);
      u.moving = Math.hypot(position.p - before.p, position.x - before.x) > 0.001;
      u.p = position.p; u.x = position.x;
      u.cooldown = Math.max(0, before.cooldown - STEP);
      u.target = target?.id ?? null;
      if (!target) { u.aiming = null; u.aimTime = 0; continue; }
      if (u.aiming !== target.id) { u.aiming = target.id; u.aimTime = spec.windup; }
      u.aimTime = Math.max(0, u.aimTime - STEP);
      if (u.cooldown > 1e-9 || u.aimTime > 1e-9) continue;
      hit(target, spec.damage, u.owner);
      const secondary = snapshot.filter(v => v.id !== target.id && v.owner !== u.owner && v.lane === u.lane && distance(v, target) <= spec.splash + 1e-9)
        .sort((a, b) => this.compareDistance(target, a, b)).slice(0, spec.maxSecondary);
      for (const v of secondary) hit(v, spec.secondary, u.owner);
      shots.push({ kind: 'shot', owner: u.owner, type: u.type, source: u.id, target: target.id, from: { p: before.p, x: before.x, lane: before.lane }, to: { p: target.p, x: target.x, lane: target.lane }, victims: [target.id, ...secondary.map(v => v.id)] });
      this.stats[u.owner].shots++;
      // Target acquisition has a short windup; consecutive shots keep the exact interval.
      u.cooldown = spec.interval;
    }
    this.tick++;
    this.time = this.tick * STEP;
    this.events.push(...shots.map(e => ({ ...e, time: this.time })));
    for (const u of this.units) {
      const pending = hits.get(u.id) || [];
      const total = pending.reduce((sum, h) => sum + h.damage, 0);
      const applied = Math.min(u.hp, total);
      if (applied > 0) {
        this.stats[other(u.owner)].damage += applied;
        this.events.push({ kind: 'hit', id: u.id, owner: u.owner, damage: applied, time: this.time });
      }
      u.hp = Math.max(0, u.hp - total);
      if (u.hp <= 0) {
        this.stats[u.owner].lost++;
        this.events.push({ kind: 'destroyed', id: u.id, owner: u.owner, type: u.type, p: u.p, x: u.x, lane: u.lane, time: this.time });
      }
    }
    this.units = this.units.filter(u => u.hp > 0);
    if (this.events.length > 2048) this.events.splice(0, this.events.length - 2048);
    this.resolveResult();
  }

  resolveResult() {
    const a = this.units.some(u => u.owner === 'orange');
    const b = this.units.some(u => u.owner === 'blue');
    if (!a || !b) this.result = a ? 'orange' : b ? 'blue' : 'draw';
  }

  advance(seconds) {
    if (!Number.isFinite(seconds) || seconds < 0) throw new RangeError('Invalid duration.');
    this.remainder += seconds;
    while (this.remainder + 1e-9 >= STEP && !this.result) { this.step(); this.remainder -= STEP; }
    if (this.result) this.remainder = 0;
  }

  run(maxSeconds = 90) {
    if (!Number.isFinite(maxSeconds) || maxSeconds < 0) throw new RangeError('Invalid measurement budget.');
    const stop = this.time + maxSeconds;
    while (!this.result && this.time < stop - 1e-9) this.step();
    return this.summary();
  }

  drainEvents() { return this.events.splice(0); }
  summary() {
    return { result: this.result || 'unresolved', time: Number(this.time.toFixed(2)), survivors: Object.fromEntries(OWNERS.map(owner => [owner, { count: this.units.filter(u => u.owner === owner).length, hp: Number(this.units.filter(u => u.owner === owner).reduce((s, u) => s + u.hp, 0).toFixed(2)) }])), stats: structuredClone(this.stats) };
  }
  snapshot() { return structuredClone({ tick: this.tick, time: this.time, result: this.result, units: this.units, stats: this.stats }); }
}
