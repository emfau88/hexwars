import { GAME_CONFIG, SUPPLY_CONFIG } from '../core/config';
import { cellKey, hexDistance, neighborsOf, ownedPathsFrom } from '../core/hex';
import { Owner, Terrain, type ArmyMovement, type HexState, type StructureState } from '../core/types';
import { terrainCapacity } from './GrowthSystem';
import { createMovement } from './MovementSystem';
import { isGuardianCell } from './StructureSystem';

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
  owners?: Owner[];
  structures?: readonly StructureState[];
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

export function supplyReserveFor(hex: HexState, front: boolean): number {
  if (!front) return garrisonFor(hex);
  return Math.max(garrisonFor(hex), Math.floor(terrainCapacity(hex) * SUPPLY_CONFIG.frontReserveRatio));
}

export function supplyTargetCapacity(hex: HexState): number {
  return Math.min(GAME_CONFIG.maxStack, Math.floor(terrainCapacity(hex) * .95));
}

function enemyBase(hexes: readonly HexState[], owner: Owner): HexState | null {
  const opponent = owner === Owner.Player ? Owner.Enemy : Owner.Player;
  return hexes.find((hex) => hex.owner === opponent && hex.terrain === Terrain.Base) ?? null;
}

export function isForwardSupplyPath(path: readonly HexState[], targetBase: HexState): boolean {
  for (let index = 1; index < path.length; index += 1) {
    if (hexDistance(path[index], targetBase) > hexDistance(path[index - 1], targetBase)) return false;
  }
  return true;
}

function supplySources(hexes: readonly HexState[], owner: Owner, structures: readonly StructureState[] = []): HexState[] {
  return hexes
    .filter((hex) => hex.owner === owner && !hex.supplyHeld && !isGuardianCell(structures, hex))
    .sort((first, second) => {
      const firstFront = isFrontHex(hexes, first, owner);
      const secondFront = isFrontHex(hexes, second, owner);
      if (firstFront !== secondFront) return Number(firstFront) - Number(secondFront);
      return cellKey(first).localeCompare(cellKey(second));
    });
}

export function hasContestedFront(hexes: readonly HexState[], owner: Owner): boolean {
  const opponent = owner === Owner.Player ? Owner.Enemy : Owner.Player;
  return hexes.some((hex) => hex.owner === owner && neighborsOf(hexes, hex).some((neighbor) => neighbor.owner === opponent));
}

/** Committed attacks must not make automatic logistics evacuate their defenders. */
export function isUnderAttack(context: SupplyContext, hex: HexState): boolean {
  const opponent = hex.owner === Owner.Player ? Owner.Enemy : Owner.Player;
  return (hex.siege?.[opponent] ?? 0) > 0
    || context.armies.some((army) => army.owner === opponent && army.kind === 'command'
      && army.toKey === cellKey(hex) && army.units > 0);
}

export function chooseSupplyRoute(
  context: SupplyContext,
  source: HexState,
  owner: Owner,
): { target: HexState; path: HexState[] } | null {
  const targetBase = enemyBase(context.hexes, owner);
  const structures = context.structures ?? [];
  const paths = ownedPathsFrom(context.hexes, source, (from, to) => !targetBase || hexDistance(to, targetBase) <= hexDistance(from, targetBase));
  const incoming = new Map<string, number>();
  for (const army of context.armies) {
    if (army.owner === owner) incoming.set(army.toKey, (incoming.get(army.toKey) ?? 0) + army.units);
  }
  const candidates = context.hexes
    .filter((target) => target.owner === owner && !isGuardianCell(structures, target))
    .filter((target) => target !== source)
    .map((target) => ({ target, path: paths.get(cellKey(target)) }))
    .filter((candidate): candidate is { target: HexState; path: HexState[] } => Boolean(candidate.path && candidate.path.length > 1))
    .filter(({ target }) => !targetBase || hexDistance(target, targetBase) < hexDistance(source, targetBase))
    .filter(({ target }) => target.units + (incoming.get(cellKey(target)) ?? 0) < supplyTargetCapacity(target))
    .map((candidate) => {
      const distanceToBase = targetBase ? hexDistance(candidate.target, targetBase) : candidate.path.length - 1;
      const load = (candidate.target.units + (incoming.get(cellKey(candidate.target)) ?? 0)) / Math.max(1, supplyTargetCapacity(candidate.target));
      const defencePriority = targetBase && isUnderAttack(context, candidate.target) ? 16 : 0;
      return { ...candidate, score: distanceToBase * 10 + load * SUPPLY_CONFIG.loadBalanceWeight + (candidate.path.length - 1) * .15 - defencePriority };
    })
    .sort((a, b) => a.score - b.score || cellKey(a.target).localeCompare(cellKey(b.target)));
  return candidates[0] ?? null;
}

export class SupplySystem {
  private readonly accumulators: Partial<Record<Owner, number>> = {};

  reset(): void { this.accumulators[Owner.Player] = 0; this.accumulators[Owner.Enemy] = 0; }

  update(context: SupplyContext, deltaSeconds: number): SupplyDispatch[] {
    if (!SUPPLY_CONFIG.enabled) return [];
    const dispatches: SupplyDispatch[] = [];
    for (const owner of context.owners ?? [Owner.Player, Owner.Enemy]) {
      const interval = hasContestedFront(context.hexes, owner)
        ? SUPPLY_CONFIG.contestedDispatchIntervalSeconds
        : SUPPLY_CONFIG.dispatchIntervalSeconds;
      const accumulated = (this.accumulators[owner] ?? 0) + deltaSeconds;
      if (accumulated < interval) { this.accumulators[owner] = accumulated; continue; }
      this.accumulators[owner] = accumulated % interval;
      for (const source of supplySources(context.hexes, owner, context.structures)) {
        if (isUnderAttack(context, source)) continue;
        const reserve = supplyReserveFor(source, isFrontHex(context.hexes, source, owner));
        const surplus = Math.floor(source.units - reserve);
        if (surplus < SUPPLY_CONFIG.dispatchThreshold) continue;
        const route = chooseSupplyRoute(context, source, owner);
        if (!route) continue;
        const incoming = context.armies.filter((army) => army.owner === owner && army.toKey === cellKey(route.target)).reduce((sum, army) => sum + army.units, 0);
        const targetCapacity = supplyTargetCapacity(route.target);
        const amount = Math.min(surplus, Math.max(0, Math.floor(targetCapacity - route.target.units - incoming)));
        if (amount < SUPPLY_CONFIG.dispatchThreshold) continue;
        source.units -= amount;
        context.armies.push(createMovement(source, route.target, owner, amount, 'supply', route.path));
        dispatches.push({ owner, units: amount, from: source, to: route.target, path: route.path });
      }
    }
    return dispatches;
  }
}
