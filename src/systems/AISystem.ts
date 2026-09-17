import { cellKey, hexDistance, neighborsOf } from '../core/hex';
import { Owner, Terrain, type HexState, type LevelDefinition } from '../core/types';
import type { RandomSource } from '../core/random';
import { defenseMultiplier } from './CombatSystem';

export interface AIContext {
  owner: Owner;
  elapsed: number;
  endgameStage: number;
  hexes: HexState[];
  level: LevelDefinition;
  random: RandomSource;
  canSend(from: HexState, to: HexState): boolean;
  incomingTo(target: HexState, owner: Owner): number;
  send(from: HexState, to: HexState, owner: Owner, units: number): boolean;
  groupPotential(target: HexState, owner: Owner, preferred?: HexState): number;
  sendGroup(target: HexState, owner: Owner, preferred?: HexState): number;
}

export interface AIAction { type: 'attack' | 'breakout' | 'reinforce' | 'logistics' | 'counter'; src: HexState; tgt: HexState; amount: number; score: number }

const opposing = (owner: Owner) => owner === Owner.Player ? Owner.Enemy : Owner.Player;

function threatened(context: AIContext, hex: HexState): number {
  let score = 0;
  const enemy = opposing(context.owner);
  if (hex.siege?.[enemy]) score += 250 + (hex.siege[enemy] ?? 0) * 5;
  for (const neighbor of neighborsOf(context.hexes, hex)) {
    if (neighbor.owner === enemy) score += 45 + Math.max(0, neighbor.units - hex.units) * 2;
  }
  if (hex.terrain === Terrain.Base) score += 90;
  return score;
}

function frontDistances(context: AIContext): Map<string, number> {
  const distances = new Map<string, number>();
  const queue: HexState[] = [];
  const enemy = opposing(context.owner);
  for (const hex of context.hexes) {
    if (hex.owner !== context.owner || !neighborsOf(context.hexes, hex).some((neighbor) => neighbor.owner === enemy)) continue;
    distances.set(cellKey(hex), 0); queue.push(hex);
  }
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    const distance = (distances.get(cellKey(current)) ?? 0) + 1;
    for (const next of neighborsOf(context.hexes, current)) {
      const key = cellKey(next);
      if (next.owner !== context.owner || distances.has(key)) continue;
      distances.set(key, distance); queue.push(next);
    }
  }
  return distances;
}

function strategicValue(context: AIContext, target: HexState): number {
  let value = target.owner === Owner.Neutral ? 18 : 60;
  if (target.terrain === Terrain.Base) value += 1500;
  if (target.terrain === Terrain.Relay) value += context.level.features.relay ? 180 : 15;
  if (target.terrain === Terrain.Hill) value += 35;
  const enemyBase = context.hexes.find((hex) => hex.owner === opposing(context.owner) && hex.terrain === Terrain.Base);
  if (enemyBase) value += (20 - hexDistance(target, enemyBase)) * 3;
  return value;
}

function baseApproach(context: AIContext): { base: HexState; urgency: number } | null {
  if (!context.level.features.all) return null;
  const base = context.hexes.find((hex) => hex.owner === context.owner && hex.terrain === Terrain.Base);
  if (!base) return null;
  const enemy = opposing(context.owner);
  let urgency = 0;
  let requiredReserve = 0;
  for (const hex of context.hexes) {
    if (hex.owner !== enemy) continue;
    const distance = hexDistance(hex, base);
    if (distance > 6) continue;
    const force = hex.units + context.incomingTo(hex, enemy);
    if (force < 10) continue;
    urgency = Math.max(urgency, (7 - distance) * 38 + force * 3);
    requiredReserve = Math.max(requiredReserve, Math.min(42, force * 1.35 + 8));
  }
  const baseReserve = base.units + context.incomingTo(base, context.owner);
  return urgency > 0 && baseReserve < requiredReserve ? { base, urgency } : null;
}

function territoryCount(context: AIContext, owner: Owner): number {
  return context.hexes.filter((hex) => hex.owner === owner).length;
}

function needsBreakout(context: AIContext): boolean {
  const ownCells = territoryCount(context, context.owner);
  const enemyCells = territoryCount(context, opposing(context.owner));
  return ownCells <= enemyCells - 4 || (context.endgameStage > 0 && ownCells <= enemyCells - 2);
}

export function chooseAIAction(context: AIContext, skill: number): AIAction | null {
  const distances = context.elapsed >= 75 ? frontDistances(context) : null;
  const approach = baseApproach(context);
  const trailing = needsBreakout(context);
  const actions: AIAction[] = [];
  for (const source of context.hexes.filter((hex) => hex.owner === context.owner && hex.units >= 4)) {
    const sourceThreat = threatened(context, source);
    const sourceDistance = distances?.get(cellKey(source));
    if (approach && source !== approach.base && context.canSend(source, approach.base) && sourceThreat < 120) {
      const reserve = source.terrain === Terrain.Base ? 5 : 3;
      const amount = Math.max(1, Math.floor(source.units * 0.6));
      if (source.units - amount >= reserve) {
        actions.push({ type: 'counter', src: source, tgt: approach.base, amount, score: approach.urgency + source.units * 2 });
      }
    }
    for (const target of context.hexes) {
      if (target === source || !context.canSend(source, target)) continue;
      if (target.owner !== context.owner) {
        const incoming = context.incomingTo(target, context.owner);
        const half = Math.max(1, Math.floor(source.units * 0.5));
        const all = Math.max(1, Math.floor(source.units - 1));
        const defense = target.units / defenseMultiplier(target);
        const needed = Math.max(1, defense - incoming + 1.5);
        const strategic = strategicValue(context, target);
        let amount = half;
        if (context.level.features.all && (needed > half * 0.9 || strategic > 300)) amount = all;
        const margin = amount + incoming - defense;
        const late = Math.max(0, Math.min(1, (context.elapsed - 45) / 100));
        const attritionOkay = target.owner === opposing(context.owner) && context.elapsed > 55 && amount + incoming >= defense * (0.62 - late * 0.15);
        const breakout = trailing && amount + incoming >= defense * (target.owner === Owner.Neutral ? .72 : .86);
        if (!breakout && !attritionOkay && margin < -Math.max(3, defense * 0.35) && strategic < 300) continue;
        let score = strategic + margin * 4 - target.units * 0.8 + late * (target.owner === opposing(context.owner) ? 55 : 0);
        if (target.owner === Owner.Neutral) score += context.owner === Owner.Enemy ? target.row * 2 : (context.level.rows - target.row) * 2;
        if (breakout) score += 210 + Math.max(0, territoryCount(context, opposing(context.owner)) - territoryCount(context, context.owner)) * 18
          + (target.owner === opposing(context.owner) ? 90 : 0);
        if (source.terrain === Terrain.Base && sourceThreat > 0) score -= 130;
        score += (context.random() - 0.5) * (1 - skill) * 110;
        actions.push({ type: breakout ? 'breakout' : 'attack', src: source, tgt: target, amount, score });
      } else {
        const targetThreat = threatened(context, target);
        const reinforceThreshold = context.endgameStage === 2 ? 40 : 60;
        if (targetThreat > reinforceThreshold && sourceThreat < 40 && target.units < source.units * 0.8) {
          actions.push({ type: 'reinforce', src: source, tgt: target, amount: Math.floor(source.units * 0.5), score: targetThreat + (source.units - target.units) * 2 });
        }
        const targetDistance = distances?.get(cellKey(target));
        if (distances && sourceThreat < 40 && sourceDistance !== undefined && targetDistance !== undefined && targetDistance < sourceDistance && source.units >= target.units + 4) {
          actions.push({ type: 'logistics', src: source, tgt: target, amount: Math.floor(source.units * 0.5), score: (context.endgameStage === 2 ? 70 : 28) + (sourceDistance - targetDistance) * 12 + (source.units - target.units) * 0.5 });
        }
      }
    }
  }
  actions.sort((a, b) => b.score - a.score);
  if (!actions.length) return null;
  const counter = actions.find((action) => action.type === 'counter');
  if (counter && counter.score >= 260) return counter;
  const breakout = actions.find((action) => action.type === 'breakout');
  if (breakout) return breakout;
  if (counter) return counter;
  const candidates = actions.slice(0, Math.min(3, actions.length));
  return context.random() < skill ? candidates[0] : candidates[Math.floor(context.random() * candidates.length)];
}

export function runAI(context: AIContext, skill: number, count = 1): number {
  let sent = 0;
  for (let index = 0; index < count; index += 1) {
    const action = chooseAIAction(context, skill);
    if (!action || action.src.units < 4) break;
    const maximum = Math.max(1, Math.floor(action.src.units - (action.src.terrain === Terrain.Base ? 3 : 1)));
    const coordinated = context.level.features.group || context.elapsed > 75;
    const attackLike = action.type === 'attack' || action.type === 'breakout';
    const groupPower = coordinated && attackLike ? context.groupPotential(action.tgt, context.owner, action.src) : 0;
    if (coordinated && attackLike && groupPower > action.amount * 1.25 && action.tgt.units > action.amount * 0.55 && context.random() < skill * 0.82) {
      sent += context.sendGroup(action.tgt, context.owner, action.src);
    } else if (context.send(action.src, action.tgt, context.owner, Math.min(action.amount, maximum))) {
      sent += action.amount;
    }
  }
  return sent;
}
