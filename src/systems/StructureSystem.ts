import { cellKey } from '../core/hex';
import { ENEMY_BASE, PLAYER_BASE } from '../core/config';
import { Owner, Terrain, type Cell, type HexState, type LevelDefinition, type StructureState } from '../core/types';

export const hqStructureId = (owner: Owner): string => owner === Owner.Player ? 'player-hq' : 'enemy-hq';

export function buildStructures(level: LevelDefinition, hexes: readonly HexState[]): StructureState[] {
  const byKey = new Map(hexes.map((hex) => [cellKey(hex), hex]));
  const structures: StructureState[] = [];
  const bases = level.bases ?? { player: PLAYER_BASE, enemy: ENEMY_BASE };
  for (const [owner, cell] of [[Owner.Player, bases.player], [Owner.Enemy, bases.enemy]] as const) {
    structures.push({
      id: hqStructureId(owner), type: 'hq', ...cell, owner, initialOwner: owner,
      status: 'active', linkedTo: null, shield: 0, maxShield: 0, footprint: .9,
    });
  }
  for (const hex of hexes) {
    if (hex.terrain !== Terrain.Relay) continue;
    structures.push({
      id: `relay-${cellKey(hex)}`, type: 'relay', col: hex.col, row: hex.row,
      owner: hex.owner, initialOwner: hex.owner, status: 'active', linkedTo: null, shield: 0, maxShield: 0, footprint: .7,
    });
  }
  for (const definition of level.structures ?? []) {
    if (structures.some(({ id }) => id === definition.id)) throw new Error(`Duplicate structure id ${definition.id}.`);
    const hex = byKey.get(cellKey(definition));
    if (!hex || hex.terrain === Terrain.Decor || hex.terrain === Terrain.Void) throw new Error(`Structure ${definition.id} needs a playable cell in ${level.id}.`);
    if (structures.some((existing) => cellKey(existing) === cellKey(definition))) throw new Error(`Structure ${definition.id} overlaps another structure in ${level.id}.`);
    const owner = definition.owner ?? hex.owner;
    const shield = Math.max(0, definition.shield ?? 0);
    const footprint = definition.footprint ?? (definition.type === 'guardian' ? .78 : .7);
    if (footprint <= 0 || footprint > 1) throw new Error(`Structure ${definition.id} has an invalid hex footprint.`);
    structures.push({
      id: definition.id, type: definition.type, col: definition.col, row: definition.row,
      owner, initialOwner: owner, status: 'active', linkedTo: definition.linkedTo ?? null,
      shield, maxShield: shield, footprint,
    });
  }
  for (const guardian of structures.filter((structure) => structure.type === 'guardian')) {
    const hq = structures.find((structure) => structure.id === guardian.linkedTo && structure.type === 'hq');
    if (!hq || hq.owner !== guardian.owner || guardian.maxShield <= 0) {
      throw new Error(`Guardian ${guardian.id} needs an allied HQ link and positive shield.`);
    }
  }
  return structures;
}

export function structureAt(structures: readonly StructureState[], cell: Cell, type?: StructureState['type']): StructureState | null {
  return structures.find((structure) => structure.col === cell.col && structure.row === cell.row && (!type || structure.type === type)) ?? null;
}

export function linkedGuardians(structures: readonly StructureState[], hqId: string): StructureState[] {
  return structures.filter((structure) => structure.type === 'guardian' && structure.linkedTo === hqId);
}

export function activeGuardians(structures: readonly StructureState[], hqId: string): StructureState[] {
  const hq = structures.find((structure) => structure.id === hqId && structure.type === 'hq');
  if (!hq) return [];
  return linkedGuardians(structures, hqId)
    .filter((guardian) => guardian.status === 'active' && guardian.owner === hq.owner && guardian.shield > 0)
    .sort((left, right) => left.id.localeCompare(right.id));
}

export function hqShield(structures: readonly StructureState[], hqId: string): { current: number; maximum: number; active: number } {
  const guardians = linkedGuardians(structures, hqId);
  const active = activeGuardians(structures, hqId);
  return {
    current: active.reduce((sum, guardian) => sum + guardian.shield, 0),
    maximum: guardians.reduce((sum, guardian) => sum + guardian.maxShield, 0),
    active: active.length,
  };
}

export function absorbHqShield(
  structures: StructureState[],
  target: HexState,
  defendingOwner: Owner,
  requested: number,
): number {
  const hq = structureAt(structures, target, 'hq');
  if (!hq || hq.owner !== defendingOwner || requested <= 0) return 0;
  let remaining = requested;
  for (const guardian of activeGuardians(structures, hq.id)) {
    const consumed = Math.min(guardian.shield, remaining);
    guardian.shield -= consumed;
    remaining -= consumed;
    if (guardian.shield <= .001) { guardian.shield = 0; guardian.status = 'disabled'; }
    if (remaining <= .001) break;
  }
  return requested - remaining;
}

export function syncStructureCapture(structures: StructureState[], hex: HexState, newOwner: Owner): StructureState | null {
  const structure = structureAt(structures, hex);
  if (!structure) return null;
  structure.owner = newOwner;
  if (structure.type === 'guardian') {
    if (newOwner !== structure.initialOwner) {
      structure.status = 'captured';
      structure.shield = 0;
    } else {
      structure.status = structure.shield > 0 ? 'active' : 'disabled';
    }
  }
  return structure;
}

export function isGuardianCell(structures: readonly StructureState[], cell: Cell): boolean {
  return structureAt(structures, cell, 'guardian') !== null;
}
