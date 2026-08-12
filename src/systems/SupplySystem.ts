import { GAME_CONFIG, SUPPLY_CONFIG } from '../core/config';
import { cellKey, findOwnedPath, neighborsOf } from '../core/hex';
import { Owner, type ArmyMovement, type HexState } from '../core/types';
import { terrainCapacity } from './GrowthSystem';
import { createMovement } from './MovementSystem';

export interface SupplyDispatch {
  owner: Owner;
  units: number;
  from: HexState;
  to: HexState;
  path: HexState[];
}

export interface SupplyContext {
  hexes: HexState[];
  armies: ArmyMovement[];
  focus: Partial<Record<Owner, string | null>>;
  owners?: Owner[];
}

export function isFrontHex(hexes: readonly HexState[], hex: HexState, owner = hex.owner): boolean {
  if (owner === Owner.Neutral || hex.owner !== owner) return false;
  return neighborsOf(hexes, hex).some((neighbor) => neighbor.owner !== owner);
}

export function frontHexes(hexes: readonly HexState[], owner: Owner): HexState[] {
  return hexes.filter((hex) => isFrontHex(hexes, hex, owner));
}

export function hinterlandHexes(hexes: readonly HexState[], owner: Owner): HexState[] {
  return hexes.filter((hex) => hex.owner === owner && !isFrontHex(hexes, hex, owner));
}

export function garrisonFor(hex: HexState): number {
  return Math.max(SUPPLY_CONFIG.minimumGarrison, Math.floor(terrainCapacity(hex) * SUPPLY_CONFIG.garrisonRatio));
}

export function chooseSupplyRoute(
  context: SupplyContext,
  source: HexState,
  owner: Owner,
): { target: HexState; path: HexState[] } | null {
  const focusKey = context.focus[owner] ?? null;
  const incoming = new Map<string, number>();
  for (const army of context.armies) {
    if (army.owner === owner && army.kind === 'supply') incoming.set(army.toKey, (incoming.get(army.toKey) ?? 0) + army.units);
  }
  const candidates = frontHexes(context.hexes, owner)
    .filter((target) => target !== source)
    .map((target) => ({ target, path: findOwnedPath(context.hexes, source, target) }))
    .filter((candidate): candidate is { target: HexState; path: HexState[] } => Boolean(candidate.path && candidate.path.length > 1))
    .filter(({ target }) => target.units + (incoming.get(cellKey(target)) ?? 0) < GAME_CONFIG.maxStack)
    .map((candidate) => {
      const focused = cellKey(candidate.target) === focusKey;
      const distanceCost = (candidate.path.length - 1) / (focused ? SUPPLY_CONFIG.focusWeight : 1);
      const load = (candidate.target.units + (incoming.get(cellKey(candidate.target)) ?? 0)) / Math.max(1, terrainCapacity(candidate.target));
      return { ...candidate, score: distanceCost + load * SUPPLY_CONFIG.loadBalanceWeight };
    })
    .sort((a, b) => a.score - b.score || cellKey(a.target).localeCompare(cellKey(b.target)));
  return candidates[0] ?? null;
}

export class SupplySystem {
  private accumulator = 0;

  reset(): void { this.accumulator = 0; }

  update(context: SupplyContext, deltaSeconds: number): SupplyDispatch[] {
    if (!SUPPLY_CONFIG.enabled) return [];
    this.accumulator += deltaSeconds;
    if (this.accumulator < SUPPLY_CONFIG.dispatchIntervalSeconds) return [];
    this.accumulator %= SUPPLY_CONFIG.dispatchIntervalSeconds;
    const dispatches: SupplyDispatch[] = [];
    for (const owner of context.owners ?? [Owner.Player, Owner.Enemy]) {
      const focus = context.focus[owner];
      if (focus && !frontHexes(context.hexes, owner).some((hex) => cellKey(hex) === focus)) context.focus[owner] = null;
      for (const source of hinterlandHexes(context.hexes, owner)) {
        const reserve = garrisonFor(source);
        const surplus = Math.floor(source.units - reserve);
        if (surplus < SUPPLY_CONFIG.dispatchThreshold) continue;
        const route = chooseSupplyRoute(context, source, owner);
        if (!route) continue;
        const incoming = context.armies.filter((army) => army.owner === owner && army.kind === 'supply' && army.toKey === cellKey(route.target)).reduce((sum, army) => sum + army.units, 0);
        const amount = Math.min(surplus, Math.max(0, Math.floor(GAME_CONFIG.maxStack - route.target.units - incoming)));
        if (amount < SUPPLY_CONFIG.dispatchThreshold) continue;
        source.units -= amount;
        context.armies.push(createMovement(source, route.target, owner, amount, 'supply', route.path));
        dispatches.push({ owner, units: amount, from: source, to: route.target, path: route.path });
      }
    }
    return dispatches;
  }
}
