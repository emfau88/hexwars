import { pathToFileURL } from 'node:url';
import { GameState } from '../src/core/GameState';
import { GAME_CONFIG } from '../src/core/config';
import { cellKey, hexDistance, isPlayable } from '../src/core/hex';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { LEVELS } from '../src/levels';
import { positionFor, REFERENCE_WORLD_GEOMETRY } from '../src/rendering/WorldGeometry';
import { defenseMultiplier } from '../src/systems/CombatSystem';
import { isUnderAttack } from '../src/systems/SupplySystem';
import { hqShield, isGuardianCell, structureAt } from '../src/systems/StructureSystem';

export const strategicPositionFor = (col: number, row: number) => positionFor(REFERENCE_WORLD_GEOMETRY, col, row);

export function conquestCost(game: GameState, hex: HexState): number {
  if (hex.owner === Owner.Player) return .15;
  const hq = structureAt(game.structures, hex, 'hq');
  const shield = hq ? hqShield(game.structures, hq.id).current : 0;
  // A route estimate, not a prediction of a moving opponent or future growth.
  return 1 + hex.units / defenseMultiplier(hex) + shield;
}

/** Dijkstra minimizes total estimated conquest cost rather than cell count. */
export function cheapestConquestRoute(game: GameState, start: HexState, goal: HexState): HexState[] {
  const cells = game.hexes.filter(isPlayable);
  const costs = new Map<HexState, number>([[start, 0]]);
  const previous = new Map<HexState, HexState>();
  const pending = new Set(cells);
  while (pending.size) {
    const current = [...pending].sort((a, b) => (costs.get(a) ?? Infinity) - (costs.get(b) ?? Infinity)
      || cellKey(a).localeCompare(cellKey(b)))[0];
    if (!Number.isFinite(costs.get(current))) break;
    pending.delete(current);
    if (current === goal) break;
    const range = current.terrain === Terrain.Relay && game.level.features.relay ? GAME_CONFIG.relayRange : 1;
    for (const next of pending) {
      if (hexDistance(current, next) > range) continue;
      const cost = costs.get(current)! + conquestCost(game, next);
      if (cost >= (costs.get(next) ?? Infinity)) continue;
      costs.set(next, cost); previous.set(next, current);
    }
  }
  if (!costs.has(goal)) return [];
  const route = [goal];
  while (route[0] !== start) {
    const prior = previous.get(route[0]);
    if (!prior) return [];
    route.unshift(prior);
  }
  return route;
}

export interface StrategicStyle {
  id: 'saved-stack' | 'automatic-stack' | 'unprotected-stack';
  supply: boolean;
  hold: boolean;
}
export const STRATEGIC_STYLES: readonly StrategicStyle[] = [
  { id: 'saved-stack', supply: false, hold: true },
  { id: 'automatic-stack', supply: true, hold: true },
  { id: 'unprotected-stack', supply: true, hold: false },
];

export function strategicTurn(game: GameState, style: StrategicStyle): { sent: number; front: HexState | null; target: HexState | null } {
  const base = game.hexes.find(h => h.owner === Owner.Player && h.terrain === Terrain.Base);
  const goal = game.hexes.find(h => h.owner === Owner.Enemy && h.terrain === Terrain.Base);
  if (!base || !goal) return { sent: 0, front: null, target: null };
  const route = cheapestConquestRoute(game, base, goal);
  const firstHostile = route.findIndex(h => h.owner !== Owner.Player);
  const front = firstHostile > 0 ? route[firstHostile - 1] : null;
  const target = firstHostile > 0 ? route[firstHostile] : null;
  for (const hex of game.hexes) if (hex.owner === Owner.Player) hex.supplyHeld = style.hold && hex === front;
  if (!front || !target) return { sent: 0, front, target };
  const committed = game.incomingTo(target, Owner.Player);
  const resistance = conquestCost(game, target) - 1;
  const required = Math.min(GAME_CONFIG.maxStack * .9, resistance + 3);
  const amount = Math.floor(front.units * (game.level.features.all ? 1 : .5));
  // Wait for a useful force; don't repeatedly trickle two-unit attacks into a defender.
  if (committed < resistance && amount >= Math.max(3, required - committed) && game.canSend(front, target)) {
    if (game.send(front, target, Owner.Player, amount, true)) return { sent: amount, front, target };
  }
  const free = Math.floor(GAME_CONFIG.maxStack - front.units - game.incomingTo(front, Owner.Player));
  const donors = game.hexes.filter(hex => hex !== front && hex.owner === Owner.Player && hex.units >= 3
    && !isGuardianCell(game.structures, hex) && !isUnderAttack(game, hex) && game.canSend(hex, front))
    .sort((a, b) => b.units - a.units);
  const donor = donors[0];
  const reinforcement = donor ? Math.min(free, Math.floor(donor.units) - 1) : 0;
  if (donor && reinforcement >= 2 && game.send(donor, front, Owner.Player, reinforcement, true)) {
    return { sent: reinforcement, front, target };
  }
  return { sent: 0, front, target };
}

export function runStrategicBalance(levelIndex: number, style: StrategicStyle, decisionSeconds = 1.2) {
  const game = new GameState(); game.start(levelIndex, strategicPositionFor);
  game.playerSupplyEnabled = style.supply;
  let nextDecision = decisionSeconds;
  let peakStack = 0;
  let peakCoverage = 1;
  let orders = 0;
  let waitingDecisions = 0;
  while (game.running && game.elapsed < 300) {
    if (game.elapsed >= nextDecision) {
      const action = strategicTurn(game, style);
      if (action.sent) orders++; else waitingDecisions++;
      peakStack = Math.max(peakStack, action.front?.units ?? 0);
      nextDecision += decisionSeconds;
    }
    peakStack = Math.max(peakStack, ...game.hexes.filter(h => h.owner === Owner.Player).map(h => h.units));
    game.update(.05); game.drainEvents();
    peakCoverage = Math.max(peakCoverage, game.fieldCount(Owner.Player));
  }
  return {
    level: levelIndex + 1, style: style.id, decisionSeconds, result: game.result ?? 'timeout',
    seconds: Number(game.elapsed.toFixed(1)), orders, waitingDecisions,
    captures: game.captures, peakCoverage, playable: game.hexes.filter(isPlayable).length,
    peakStack: Number(peakStack.toFixed(1)),
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const rows = LEVELS.flatMap((_, index) => STRATEGIC_STYLES.map(style => runStrategicBalance(index, style)));
  if (process.argv.includes('--json')) console.log(JSON.stringify(rows, null, 2));
  else console.table(rows);
}
