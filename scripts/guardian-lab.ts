import { GAME_CONFIG } from '../src/core/config';
import { GameState } from '../src/core/GameState';
import { cellKey, hexDistance, isPlayable } from '../src/core/hex';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { LEVELS } from '../src/levels';
import { actDoomstack, doomstackPositionFor, rawForce, shortestPlayableRoute } from './doomstack';

export type GuardianModel = 'baseline' | 'shield-pool' | 'defense-multiplier' | 'network-defense';
export type GuardianStrategy = 'direct' | 'one-guardian' | 'two-guardians' | 'split-front';

export interface GuardianLabOptions {
  levelIndex: number;
  model: GuardianModel;
  strategy: GuardianStrategy;
  strength?: number;
  supply?: boolean;
  opponentEnabled?: boolean;
  decisionIntervalSeconds?: number;
  maxSeconds?: number;
}

export interface GuardianLabMetrics {
  level: number;
  name: string;
  model: GuardianModel;
  strategy: GuardianStrategy;
  strength: number;
  supply: boolean;
  opponentEnabled: boolean;
  result: string | null;
  seconds: number;
  actions: number;
  captures: number;
  guardiansCaptured: number;
  guardiansControlledAtEnd: number;
  sentUnits: number;
  protectionAbsorbed: number;
  playerForceAtEnd: number;
  enemyForceAtEnd: number;
  maxMapCoverage: number;
  playableCells: number;
  maxFrontStack: number;
  maxFrontStackShare: number;
  routeColumns: number;
}

interface LabSetup {
  enemyBase: HexState;
  guardians: readonly [HexState, HexState];
  networkSectors: HexState[];
  shieldRemaining: Map<string, number>;
  plans: RoutePlan[];
}

interface RoutePlan {
  segments: HexState[][];
  current: number;
}

const GUARDIAN_UNITS = 10;
const DEFAULT_STRENGTH: Record<GuardianModel, number> = {
  baseline: 0,
  'shield-pool': 20,
  'defense-multiplier': .14,
  'network-defense': .8,
};

function bases(game: GameState): { player: HexState; enemy: HexState } {
  const player = game.hexes.find((hex) => hex.owner === Owner.Player && hex.terrain === Terrain.Base);
  const enemy = game.hexes.find((hex) => hex.owner === Owner.Enemy && hex.terrain === Terrain.Base);
  if (!player || !enemy) throw new Error('Guardian lab requires both bases.');
  return { player, enemy };
}

export function guardianCells(game: GameState): readonly [HexState, HexState] {
  const { enemy } = bases(game);
  const candidates = game.hexes
    .filter((hex) => isPlayable(hex) && hex !== enemy && hex.row > enemy.row)
    .filter((hex) => hexDistance(hex, enemy) === 2)
    .sort((first, second) => first.row - second.row || first.col - second.col);
  const left = candidates.filter((hex) => hex.col < enemy.col).sort((a, b) => b.col - a.col || a.row - b.row)[0];
  const right = candidates.filter((hex) => hex.col > enemy.col).sort((a, b) => a.col - b.col || a.row - b.row)[0];
  if (!left || !right) throw new Error(`Level ${game.currentLevel + 1} has no two-sided guardian proxy positions.`);
  return [left, right];
}

function routeVia(game: GameState, waypoints: HexState[]): HexState[][] {
  const { enemy } = bases(game);
  const segments: HexState[][] = [];
  for (let index = 0; index < waypoints.length - 1; index += 1) {
    const start = waypoints[index];
    const goal = waypoints[index + 1];
    const blocked = new Set<string>();
    if (goal !== enemy) blocked.add(cellKey(enemy));
    segments.push(shortestPlayableRoute(game, start, goal, blocked));
  }
  return segments;
}

function routeLength(segments: readonly HexState[][]): number {
  return segments.reduce((sum, segment) => sum + segment.length - 1, 0);
}

function strategyPlans(game: GameState, guardians: readonly [HexState, HexState], strategy: GuardianStrategy): RoutePlan[] {
  const { player, enemy } = bases(game);
  if (strategy === 'direct') return [{ segments: [[...shortestPlayableRoute(game, player, enemy)]], current: 0 }];
  if (strategy === 'one-guardian') {
    const candidates = guardians.map((guardian) => routeVia(game, [player, guardian, enemy]));
    return [{ segments: candidates.sort((a, b) => routeLength(a) - routeLength(b))[0], current: 0 }];
  }
  if (strategy === 'two-guardians') {
    const first = routeVia(game, [player, guardians[0], guardians[1], enemy]);
    const second = routeVia(game, [player, guardians[1], guardians[0], enemy]);
    return [{ segments: routeLength(first) <= routeLength(second) ? first : second, current: 0 }];
  }
  return guardians.map((guardian) => ({ segments: routeVia(game, [player, guardian, enemy]), current: 0 }));
}

function installLab(game: GameState, strategy: GuardianStrategy, shieldPerGuardian: number): LabSetup {
  const { enemy } = bases(game);
  const guardians = guardianCells(game);
  for (const guardian of guardians) {
    guardian.owner = Owner.Neutral;
    guardian.units = Math.max(GUARDIAN_UNITS, guardian.units);
    guardian.fixedUnits = GUARDIAN_UNITS;
  }
  const networkSectors = game.hexes.filter((hex) => isPlayable(hex) && hex !== enemy && hexDistance(hex, enemy) <= 2);
  return {
    enemyBase: enemy,
    guardians,
    networkSectors,
    shieldRemaining: new Map(guardians.map((guardian) => [cellKey(guardian), shieldPerGuardian])),
    plans: strategyPlans(game, guardians, strategy),
  };
}

function activeGuardians(setup: LabSetup): HexState[] {
  return setup.guardians.filter((guardian) => guardian.owner !== Owner.Player);
}

function absorbSiege(hex: HexState, amount: number): number {
  const incoming = hex.siege?.[Owner.Player] ?? 0;
  const absorbed = Math.min(incoming, Math.max(0, amount));
  if (absorbed <= 0 || !hex.siege) return 0;
  hex.siege[Owner.Player] = incoming - absorbed;
  if ((hex.siege[Owner.Player] ?? 0) <= .001) delete hex.siege[Owner.Player];
  if (Object.keys(hex.siege).length === 0) hex.siege = null;
  return absorbed;
}

function applyProtection(game: GameState, setup: LabSetup, model: GuardianModel, strength: number, deltaSeconds: number): number {
  const active = activeGuardians(setup);
  if (model === 'baseline') return 0;
  if (model === 'shield-pool') {
    if (!active.length) return 0;
    let incoming = setup.enemyBase.siege?.[Owner.Player] ?? 0;
    let absorbed = 0;
    for (const guardian of active) {
      const key = cellKey(guardian);
      const remaining = setup.shieldRemaining.get(key) ?? 0;
      const spent = Math.min(incoming, remaining);
      setup.shieldRemaining.set(key, remaining - spent);
      incoming -= spent;
      absorbed += spent;
      if (incoming <= 0) break;
    }
    return absorbSiege(setup.enemyBase, absorbed);
  }
  if (model === 'defense-multiplier') {
    if (!active.length) return 0;
    const attackers = setup.enemyBase.siege?.[Owner.Player] ?? 0;
    if (attackers <= 0 || setup.enemyBase.units <= 0) return 0;
    const protectedFactor = Math.max(.26, .82 - active.length * strength);
    const clash = Math.min(attackers, setup.enemyBase.units, GAME_CONFIG.battleRate * deltaSeconds);
    const preserved = clash * (.82 - protectedFactor);
    setup.enemyBase.units += preserved;
    return preserved;
  }
  const controlledSectors = setup.networkSectors.filter((sector) => sector.owner !== Owner.Player).length;
  if (!controlledSectors) return 0;
  let absorbed = 0;
  for (const hex of game.hexes) {
    if (hexDistance(hex, setup.enemyBase) > 2) continue;
    absorbed += absorbSiege(hex, strength * controlledSectors * deltaSeconds);
  }
  return absorbed;
}

function currentSegment(plan: RoutePlan): HexState[] {
  while (plan.current < plan.segments.length - 1) {
    const goal = plan.segments[plan.current].at(-1);
    if (goal?.owner !== Owner.Player) break;
    plan.current += 1;
  }
  return plan.segments[plan.current];
}

function frontStack(game: GameState, plans: readonly RoutePlan[]): number {
  let maximum = 0;
  for (const plan of plans) {
    const route = currentSegment(plan);
    const front = [...route].reverse().map((hex) => game.hexAt(hex.col, hex.row)).find((hex) => hex?.owner === Owner.Player);
    if (front) maximum = Math.max(maximum, front.units + game.incomingTo(front, Owner.Player));
  }
  return maximum;
}

export function runGuardianLab(options: GuardianLabOptions): GuardianLabMetrics {
  const strength = options.strength ?? DEFAULT_STRENGTH[options.model];
  const decisionInterval = options.decisionIntervalSeconds ?? 1.4;
  const maxSeconds = options.maxSeconds ?? 300;
  const game = new GameState();
  game.start(options.levelIndex, doomstackPositionFor);
  game.playerSupplyEnabled = options.supply ?? true;
  game.opponentEnabled = options.opponentEnabled ?? false;
  const setup = installLab(game, options.strategy, options.model === 'shield-pool' ? strength : 0);
  const guardianKeys = new Set(setup.guardians.map(cellKey));
  const capturedGuardians = new Set<string>();
  const playableCells = game.hexes.filter(isPlayable).length;
  let nextDecision = decisionInterval;
  let routeIndex = 0;
  let sentUnits = 0;
  let protectionAbsorbed = 0;
  let maxMapCoverage = game.fieldCount(Owner.Player);
  let maxFrontStack = 0;
  let maxFrontStackShare = 0;
  while (game.running && game.elapsed < maxSeconds) {
    protectionAbsorbed += applyProtection(game, setup, options.model, strength, .05);
    game.update(.05);
    for (const event of game.drainEvents()) {
      if (event.type === 'capture' && event.detail.newOwner === Owner.Player && guardianKeys.has(cellKey(event.detail.target))) {
        capturedGuardians.add(cellKey(event.detail.target));
      }
    }
    maxMapCoverage = Math.max(maxMapCoverage, game.fieldCount(Owner.Player));
    const stack = frontStack(game, setup.plans);
    maxFrontStack = Math.max(maxFrontStack, stack);
    maxFrontStackShare = Math.max(maxFrontStackShare, stack / Math.max(1, rawForce(game, Owner.Player)));
    if (game.elapsed >= nextDecision) {
      const splitPending = options.strategy === 'split-front' && activeGuardians(setup).length > 0;
      const fraction = splitPending ? .5 : 1;
      sentUnits += actDoomstack(game, currentSegment(setup.plans[routeIndex]), fraction, true);
      if (options.strategy === 'split-front') routeIndex = (routeIndex + 1) % setup.plans.length;
      nextDecision += decisionInterval;
    }
  }
  return {
    level: options.levelIndex + 1,
    name: LEVELS[options.levelIndex]?.short.en ?? `LEVEL ${options.levelIndex + 1}`,
    model: options.model,
    strategy: options.strategy,
    strength,
    supply: options.supply ?? true,
    opponentEnabled: options.opponentEnabled ?? false,
    result: game.result ?? (game.running ? 'timeout' : null),
    seconds: Number(game.elapsed.toFixed(1)),
    actions: game.actions,
    captures: game.captures,
    guardiansCaptured: capturedGuardians.size,
    guardiansControlledAtEnd: setup.guardians.filter((guardian) => guardian.owner === Owner.Player).length,
    sentUnits,
    protectionAbsorbed: Number(protectionAbsorbed.toFixed(1)),
    playerForceAtEnd: rawForce(game, Owner.Player),
    enemyForceAtEnd: rawForce(game, Owner.Enemy),
    maxMapCoverage,
    playableCells,
    maxFrontStack: Number(maxFrontStack.toFixed(1)),
    maxFrontStackShare: Number(maxFrontStackShare.toFixed(3)),
    routeColumns: new Set(setup.plans.flatMap((plan) => plan.segments.flat()).map((hex) => hex.col)).size,
  };
}

export const GUARDIAN_LAB_LEVELS = [1, 2, 4, 7] as const;
export const GUARDIAN_LAB_STRATEGIES: readonly GuardianStrategy[] = ['direct', 'one-guardian', 'two-guardians', 'split-front'];

export function runGuardianSweep(): GuardianLabMetrics[] {
  const strengths: Record<Exclude<GuardianModel, 'baseline'>, readonly number[]> = {
    'shield-pool': [28, 48, 96],
    'defense-multiplier': [.14, .2, .28],
    'network-defense': [.45, .8, 1.15],
  };
  const rows: GuardianLabMetrics[] = [];
  for (const levelIndex of GUARDIAN_LAB_LEVELS) {
    for (const strategy of GUARDIAN_LAB_STRATEGIES) rows.push(runGuardianLab({ levelIndex, model: 'baseline', strategy }));
    for (const [model, values] of Object.entries(strengths) as [Exclude<GuardianModel, 'baseline'>, readonly number[]][]) {
      for (const strength of values) {
        for (const strategy of GUARDIAN_LAB_STRATEGIES) rows.push(runGuardianLab({ levelIndex, model, strength, strategy }));
      }
    }
  }
  return rows;
}
