import { Terrain, type Cell, type HexState } from './types';

export const cellKey = (cell: Cell): string => `${cell.col},${cell.row}`;

export function parseCellKey(value: string): Cell {
  const [col, row] = value.split(',').map(Number);
  return { col, row };
}

function toCube(cell: Cell): { x: number; y: number; z: number } {
  const x = cell.col - (cell.row - (cell.row & 1)) / 2;
  const z = cell.row;
  return { x, y: -x - z, z };
}

export function hexDistance(a: Cell, b: Cell): number {
  const first = toCube(a);
  const second = toCube(b);
  return (
    Math.abs(first.x - second.x) +
    Math.abs(first.y - second.y) +
    Math.abs(first.z - second.z)
  ) / 2;
}

export function isPlayable(hex: HexState | null | undefined): hex is HexState {
  return Boolean(hex && hex.terrain !== Terrain.Void && hex.terrain !== Terrain.Decor);
}

export function neighborsOf(hexes: readonly HexState[], source: Cell): HexState[] {
  return hexes.filter((candidate) => isPlayable(candidate) && hexDistance(source, candidate) === 1);
}

export function findOwnedPath(
  hexes: readonly HexState[],
  start: HexState,
  goal: HexState,
): HexState[] | null {
  if (start.owner !== goal.owner || start.owner === 0) return null;
  const byKey = new Map(hexes.map((hex) => [cellKey(hex), hex]));
  const startKey = cellKey(start);
  const goalKey = cellKey(goal);
  const queue = [startKey];
  const previous = new Map<string, string | null>([[startKey, null]]);
  for (let index = 0; index < queue.length; index += 1) {
    const currentKey = queue[index];
    if (currentKey === goalKey) break;
    const current = byKey.get(currentKey);
    if (!current) continue;
    for (const next of neighborsOf(hexes, current)) {
      const nextKey = cellKey(next);
      if (next.owner !== start.owner || previous.has(nextKey)) continue;
      previous.set(nextKey, currentKey);
      queue.push(nextKey);
    }
  }
  if (!previous.has(goalKey)) return null;
  const path: HexState[] = [];
  for (let cursor: string | null = goalKey; cursor; cursor = previous.get(cursor) ?? null) {
    const hex = byKey.get(cursor);
    if (hex) path.push(hex);
  }
  return path.reverse();
}

