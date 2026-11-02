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
  canStep?: (from: HexState, to: HexState) => boolean,
): HexState[] | null {
  if (start.owner !== goal.owner || start.owner === 0) return null;
  return ownedPathsFrom(hexes, start, canStep, goal).get(cellKey(goal)) ?? null;
}

/** One breadth-first search for all supply destinations, with constraints on each edge. */
export function ownedPathsFrom(
  hexes: readonly HexState[], start: HexState,
  canStep: (from: HexState, to: HexState) => boolean = () => true,
  goal?: HexState,
): Map<string, HexState[]> {
  const paths = new Map<string, HexState[]>();
  if (start.owner === 0 || !isPlayable(start)) return paths;
  const queue = [start];
  paths.set(cellKey(start), [start]);
  for (let index = 0; index < queue.length; index += 1) {
    const current = queue[index];
    if (current === goal) break;
    for (const next of neighborsOf(hexes, current)) {
      const nextKey = cellKey(next);
      if (next.owner !== start.owner || paths.has(nextKey) || !canStep(current, next)) continue;
      paths.set(nextKey, [...paths.get(cellKey(current))!, next]);
      queue.push(next);
    }
  }
  return paths;
}

