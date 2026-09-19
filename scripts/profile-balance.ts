import { GameState } from '../src/core/GameState';
import { pathToFileURL } from 'node:url';
import { hexDistance, isPlayable } from '../src/core/hex';
import { Owner, Terrain, type HexState } from '../src/core/types';
import { defenseMultiplier } from '../src/systems/CombatSystem';
import { hqShield, structureAt } from '../src/systems/StructureSystem';
import { LEVELS } from '../src/levels';

const POSITION_SCALE = { column: 50, row: 45, stagger: 25 };
const MAX_SECONDS = 300;
const STEP_SECONDS = .05;

export type ProfileId = 'cautious' | 'aggressive' | 'tactical';

export interface PlayerProfile {
  id: ProfileId;
  label: string;
  firstDecisionSeconds: number;
  decisionIntervalSeconds: number;
  targetScanLimit: number;
  defenseRounding: number;
}

export interface ProfileVariant {
  id: 'steady' | 'pressure' | 'deliberate' | 'left' | 'right';
  label: string;
  firstDecisionOffset: number;
  decisionIntervalMultiplier: number;
}

export interface ProfileBalanceRow {
  profile: ProfileId;
  variant: ProfileVariant['id'];
  level: number;
  name: string;
  result: 'victory' | 'defeat' | 'timeout' | null;
  seconds: number;
  actions: number;
  captures: number;
  firstAiAction: number | null;
  maxCellDeficit: number;
  maxForceDeficit: number;
  fields: string;
  forces: string;
}

export interface ProfileBalanceSummary {
  profile: ProfileId;
  level: number;
  name: string;
  wins: number;
  runs: number;
  winRate: number;
  averageSeconds: number;
  outcomes: string;
}

export const PLAYER_PROFILES: readonly PlayerProfile[] = [
  { id: 'cautious', label: 'CAUTIOUS · 50% / RESERVES', firstDecisionSeconds: 1.8, decisionIntervalSeconds: 1.7, targetScanLimit: 8, defenseRounding: 2 },
  { id: 'aggressive', label: 'AGGRESSIVE · BREAKTHROUGHS', firstDecisionSeconds: 1.2, decisionIntervalSeconds: 1.25, targetScanLimit: 8, defenseRounding: 5 },
  { id: 'tactical', label: 'TACTICAL · GROUP / ROUTES', firstDecisionSeconds: .9, decisionIntervalSeconds: 1.05, targetScanLimit: 10, defenseRounding: 2 },
];

export const PROFILE_VARIANTS: readonly ProfileVariant[] = [
  { id: 'steady', label: 'STEADY', firstDecisionOffset: 0, decisionIntervalMultiplier: 1 },
  { id: 'pressure', label: 'PRESSURE', firstDecisionOffset: -.2, decisionIntervalMultiplier: .9 },
  { id: 'deliberate', label: 'DELIBERATE', firstDecisionOffset: .2, decisionIntervalMultiplier: 1.1 },
  { id: 'left', label: 'LEFT ROUTE', firstDecisionOffset: 0, decisionIntervalMultiplier: 1 },
  { id: 'right', label: 'RIGHT ROUTE', firstDecisionOffset: 0, decisionIntervalMultiplier: 1 },
];

function positionFor(col: number, row: number) {
  return { x: col * POSITION_SCALE.column + (row % 2 ? POSITION_SCALE.stagger : 0), y: row * POSITION_SCALE.row };
}

function enemyBase(game: GameState): HexState | null {
  return game.hexes.find((hex) => hex.owner === Owner.Enemy && hex.terrain === Terrain.Base) ?? null;
}

function estimatedDefense(game: GameState, target: HexState, profile: PlayerProfile): number {
  const hq = structureAt(game.structures, target, 'hq');
  const shield = hq ? hqShield(game.structures, hq.id).current : 0;
  const exact = target.units / defenseMultiplier(target) + shield + game.incomingTo(target, Owner.Enemy);
  return Math.max(1, Math.round(exact / profile.defenseRounding) * profile.defenseRounding);
}

function attackTargets(game: GameState, profile: PlayerProfile, variant: ProfileVariant): HexState[] {
  const base = enemyBase(game);
  return game.hexes
    .filter((target) => isPlayable(target) && target.owner !== Owner.Player)
    .filter((target) => game.hexes.some((source) => source.owner === Owner.Player && source.units >= 2 && game.canSend(source, target)))
    .sort((first, second) => scoreTarget(game, second, base, variant) - scoreTarget(game, first, base, variant))
    .slice(0, profile.targetScanLimit);
}

function scoreTarget(game: GameState, target: HexState, base: HexState | null, variant: ProfileVariant): number {
  const distance = base ? hexDistance(target, base) : 10;
  let score = (18 - distance) * 12 - target.units * .65;
  if (target.owner === Owner.Neutral) score += 50;
  if (target.owner === Owner.Enemy) score += 95;
  if (target.terrain === Terrain.Relay) score += 55;
  if (target.terrain === Terrain.Hill) score += 20;
  if (target.terrain === Terrain.Base) {
    const hq = structureAt(game.structures, target, 'hq');
    score += hq && hqShield(game.structures, hq.id).current > 0 ? 420 : 5000;
  }
  const structure = structureAt(game.structures, target, 'guardian');
  if (structure?.status === 'active' && structure.owner === Owner.Enemy) score += 900 + structure.shield * 3;
  if (variant.id === 'pressure' && target.owner === Owner.Enemy) score += 55;
  if (variant.id === 'left') score += (6 - target.col) * 6;
  if (variant.id === 'right') score += target.col * 6;
  if (variant.id === 'deliberate') score += (target.terrain === Terrain.Hill ? 22 : 0) + (target.terrain === Terrain.Relay ? 28 : 0);
  return score;
}

function attackers(game: GameState, target: HexState): HexState[] {
  return game.hexes
    .filter((source) => source.owner === Owner.Player && source.units >= 2 && game.canSend(source, target))
    .sort((first, second) => second.units - first.units);
}

function reinforceForward(game: GameState): boolean {
  const base = enemyBase(game);
  if (!base) return false;
  const owned = game.hexes.filter((hex) => hex.owner === Owner.Player && hex.units >= 4);
  const target = [...owned].sort((first, second) => hexDistance(first, base) - hexDistance(second, base) || first.units - second.units)[0];
  if (!target) return false;
  const source = owned
    .filter((candidate) => candidate !== target && game.canSend(candidate, target))
    .filter((candidate) => hexDistance(candidate, base) > hexDistance(target, base))
    .sort((first, second) => second.units - first.units)[0];
  return Boolean(source && game.send(source, target, Owner.Player, Math.floor(source.units * .5), true));
}

function cautiousTurn(game: GameState, profile: PlayerProfile, variant: ProfileVariant): boolean {
  for (const target of attackTargets(game, profile, variant)) {
    const defense = estimatedDefense(game, target, profile);
    const source = attackers(game, target).find((candidate) => Math.floor(candidate.units * .5) >= defense + 1);
    if (source && game.send(source, target, Owner.Player, Math.floor(source.units * .5), true)) return true;
  }
  return reinforceForward(game);
}

function aggressiveTurn(game: GameState, profile: PlayerProfile, variant: ProfileVariant): boolean {
  const allowAll = game.level.features.all;
  for (const target of attackTargets(game, profile, variant)) {
    const defense = estimatedDefense(game, target, profile);
    const source = attackers(game, target)[0];
    if (!source) continue;
    const half = Math.floor(source.units * .5);
    const all = Math.floor(source.units);
    const breakthrough = allowAll && (target.terrain === Terrain.Base || (all >= defense + 1 && half < defense + 1));
    const amount = breakthrough ? all : half;
    if (amount >= defense * .72 && game.send(source, target, Owner.Player, amount, true)) return true;
  }
  return reinforceForward(game);
}

function tacticalTurn(game: GameState, profile: PlayerProfile, variant: ProfileVariant): boolean {
  for (const target of attackTargets(game, profile, variant)) {
    const defense = estimatedDefense(game, target, profile);
    const preferred = attackers(game, target)[0];
    if (!preferred) continue;
    const groupPower = game.level.features.group ? game.groupPotential(target, Owner.Player, preferred) : 0;
    if (groupPower >= defense + 1 && game.sendGroup(target, Owner.Player, true, preferred) > 0) return true;
    const half = Math.floor(preferred.units * .5);
    const all = Math.floor(preferred.units);
    const amount = game.level.features.all && all >= defense + 1 && half < defense + 1 ? all : half;
    if (amount >= defense * .8 && game.send(preferred, target, Owner.Player, amount, true)) return true;
  }
  return reinforceForward(game);
}

function playTurn(game: GameState, profile: PlayerProfile, variant: ProfileVariant): boolean {
  if (profile.id === 'cautious') return cautiousTurn(game, profile, variant);
  if (profile.id === 'aggressive') return aggressiveTurn(game, profile, variant);
  return tacticalTurn(game, profile, variant);
}

function forceDeficit(game: GameState): number {
  return Math.max(0, game.forceCount(Owner.Enemy) - game.forceCount(Owner.Player));
}

export function runProfileBalance(levelIndex: number, profile: PlayerProfile, variant: ProfileVariant = PROFILE_VARIANTS[0]): ProfileBalanceRow {
  const game = new GameState();
  game.start(levelIndex, positionFor);
  let nextDecision = Math.max(.25, profile.firstDecisionSeconds + variant.firstDecisionOffset);
  let firstAiAction: number | null = null;
  let maxCellDeficit = 0;
  let maxForceDeficit = 0;
  while (game.running && game.elapsed < MAX_SECONDS) {
    game.update(STEP_SECONDS);
    for (const event of game.drainEvents()) {
      if (firstAiAction === null && event.type === 'send' && event.detail.owner === Owner.Enemy) firstAiAction = game.elapsed;
    }
    maxCellDeficit = Math.max(maxCellDeficit, game.fieldCount(Owner.Enemy) - game.fieldCount(Owner.Player));
    maxForceDeficit = Math.max(maxForceDeficit, forceDeficit(game));
    if (game.elapsed >= nextDecision) {
      playTurn(game, profile, variant);
      nextDecision += profile.decisionIntervalSeconds * variant.decisionIntervalMultiplier;
    }
  }
  const snapshot = game.snapshot();
  return {
    profile: profile.id,
    variant: variant.id,
    level: levelIndex + 1,
    name: LEVELS[levelIndex]?.short.en ?? `LEVEL ${levelIndex + 1}`,
    result: game.result ?? (game.running ? 'timeout' : null),
    seconds: Number(game.elapsed.toFixed(1)),
    actions: snapshot.actions,
    captures: snapshot.captures,
    firstAiAction: firstAiAction === null ? null : Number(firstAiAction.toFixed(2)),
    maxCellDeficit,
    maxForceDeficit: Math.round(maxForceDeficit),
    fields: `${snapshot.fields.p1}:${snapshot.fields.p2}`,
    forces: `${snapshot.forces.p1}:${snapshot.forces.p2}`,
  };
}

export function runProfileBalanceCampaign(): ProfileBalanceRow[] {
  return PLAYER_PROFILES.flatMap((profile) => PROFILE_VARIANTS.flatMap((variant) => LEVELS.map((_level, index) => runProfileBalance(index, profile, variant))));
}

export function summarizeProfileBalance(rows: readonly ProfileBalanceRow[]): ProfileBalanceSummary[] {
  return PLAYER_PROFILES.flatMap((profile) => LEVELS.map((_level, index) => {
    const runs = rows.filter((row) => row.profile === profile.id && row.level === index + 1);
    const wins = runs.filter((row) => row.result === 'victory').length;
    const totalSeconds = runs.reduce((sum, row) => sum + row.seconds, 0);
    const outcomes = PROFILE_VARIANTS.map((variant) => {
      const result = runs.find((row) => row.variant === variant.id)?.result;
      return `${variant.id[0].toUpperCase()}:${result === 'victory' ? 'V' : result === 'defeat' ? 'D' : 'T'}`;
    }).join(' ');
    return {
      profile: profile.id,
      level: index + 1,
      name: LEVELS[index]?.short.en ?? `LEVEL ${index + 1}`,
      wins,
      runs: runs.length,
      winRate: runs.length ? Number((wins / runs.length * 100).toFixed(0)) : 0,
      averageSeconds: runs.length ? Number((totalSeconds / runs.length).toFixed(1)) : 0,
      outcomes,
    };
  }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  console.table(summarizeProfileBalance(runProfileBalanceCampaign()).map((row) => ({
    profile: row.profile,
    level: row.level,
    name: row.name,
    wins: `${row.wins}/${row.runs}`,
    winRate: `${row.winRate}%`,
    averageSeconds: row.averageSeconds,
    outcomes: row.outcomes,
  })));
}
