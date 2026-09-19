import { GameState } from '../src/core/GameState';
import { cellKey, isPlayable, neighborsOf } from '../src/core/hex';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { LEVELS } from '../src/levels';

const POSITION_SCALE = { column: 50, row: 45, stagger: 25 };

export interface DoomstackMetrics {
  level: number;
  name: string;
  skipped: boolean;
  result: string | null;
  seconds: number;
  actions: number;
  captures: number;
  maxMapCoverage: number;
  playableCells: number;
  maxFrontStack: number;
  maxFrontStackShare: number;
  groupActions: number;
}

export function doomstackPositionFor(col: number, row: number) {
  return { x: col * POSITION_SCALE.column + (row % 2 ? POSITION_SCALE.stagger : 0), y: row * POSITION_SCALE.row };
}

export function shortestPlayableRoute(
  game: GameState,
  start = game.hexes.find((hex) => hex.owner === Owner.Player && hex.terrain === Terrain.Base),
  goal = game.hexes.find((hex) => hex.owner === Owner.Enemy && hex.terrain === Terrain.Base),
  blocked = new Set<string>(),
): HexState[] {
  if (!start || !goal) throw new Error('Doomstack simulation requires a route start and goal.');

  const queue = [start];
  const previous = new Map<string, string | null>([[cellKey(start), null]]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === goal) break;
    for (const next of neighborsOf(game.hexes, current)) {
      const key = cellKey(next);
      if (previous.has(key) || (next !== goal && blocked.has(key))) continue;
      previous.set(key, cellKey(current));
      queue.push(next);
    }
  }
  if (!previous.has(cellKey(goal))) throw new Error('Doomstack simulation could not find a playable route.');

  const byKey = new Map(game.hexes.map((hex) => [cellKey(hex), hex]));
  const route: HexState[] = [];
  for (let key: string | null = cellKey(goal); key; key = previous.get(key) ?? null) {
    const hex = byKey.get(key);
    if (hex) route.unshift(hex);
  }
  return route;
}

export function rawForce(game: GameState, owner: Owner): number {
  const stationed = game.hexes.reduce((sum, hex) => sum + (hex.owner === owner ? hex.units : 0) + (hex.siege?.[owner] ?? 0), 0);
  return stationed + game.armies.filter((army) => army.owner === owner).reduce((sum, army) => sum + army.units, 0);
}

export function actDoomstack(game: GameState, route: HexState[], fraction = 1, selectReachableDonor = false): number {
  const ownedRoute = route
    .map((cell, index) => ({ index, hex: game.hexAt(cell.col, cell.row) }))
    .filter((entry): entry is { index: number; hex: HexState } => entry.hex?.owner === Owner.Player);
  const front = ownedRoute.at(-1);
  if (!front || front.index >= route.length - 1) return 0;

  const target = game.hexAt(route[front.index + 1].col, route[front.index + 1].row);
  if (!target) return 0;
  if (front.hex.units >= 2) {
    const amount = Math.max(1, Math.floor(front.hex.units * fraction));
    return game.send(front.hex, target, Owner.Player, amount, true) ? amount : 0;
  }

  const donors = ownedRoute
    .filter((entry) => entry.index < front.index && entry.hex.units >= 2)
    .sort((first, second) => second.hex.units - first.hex.units);
  const donor = selectReachableDonor ? donors.find((entry) => game.canSend(entry.hex, front.hex)) : donors[0];
  if (!donor) return 0;
  const amount = Math.max(1, Math.floor(donor.hex.units * fraction));
  return game.send(donor.hex, front.hex, Owner.Player, amount, true) ? amount : 0;
}

/** A deliberately primitive single-route opponent that never uses GROUP. */
export function runDoomstack(levelIndex: number, decisionIntervalSeconds = 1.4): DoomstackMetrics {
  const game = new GameState();
  game.start(levelIndex, doomstackPositionFor);
  const level = LEVELS[levelIndex] ?? LEVELS[0];
  const playableCells = game.hexes.filter(isPlayable).length;
  if (!level.features.all) {
    return {
      level: levelIndex + 1, name: level.short.en, skipped: true, result: null, seconds: 0, actions: 0, captures: 0,
      maxMapCoverage: game.fieldCount(Owner.Player), playableCells, maxFrontStack: 0, maxFrontStackShare: 0, groupActions: 0,
    };
  }

  const route = shortestPlayableRoute(game);
  let nextDecision = decisionIntervalSeconds;
  let maxMapCoverage = game.fieldCount(Owner.Player);
  let maxFrontStack = 0;
  let maxFrontStackShare = 0;
  while (game.running && game.elapsed < 300) {
    game.update(.05);
    game.drainEvents();
    maxMapCoverage = Math.max(maxMapCoverage, game.fieldCount(Owner.Player));
    const front = [...route].reverse().map((hex) => game.hexAt(hex.col, hex.row)).find((hex) => hex?.owner === Owner.Player);
    if (front) {
      const stack = front.units + game.incomingTo(front, Owner.Player);
      maxFrontStack = Math.max(maxFrontStack, stack);
      maxFrontStackShare = Math.max(maxFrontStackShare, stack / Math.max(1, rawForce(game, Owner.Player)));
    }
    if (game.elapsed >= nextDecision) {
      actDoomstack(game, route);
      nextDecision += decisionIntervalSeconds;
    }
  }
  return {
    level: levelIndex + 1,
    name: level.short.en,
    skipped: false,
    result: game.result,
    seconds: Number(game.elapsed.toFixed(1)),
    actions: game.actions,
    captures: game.captures,
    maxMapCoverage,
    playableCells,
    maxFrontStack: Number(maxFrontStack.toFixed(1)),
    maxFrontStackShare: Number(maxFrontStackShare.toFixed(3)),
    groupActions: 0,
  };
}

export function runDoomstackCampaign(decisionIntervalSeconds = 1.4): DoomstackMetrics[] {
  return LEVELS.map((_level, index) => runDoomstack(index, decisionIntervalSeconds));
}
