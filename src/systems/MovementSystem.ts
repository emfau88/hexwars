import { GAME_CONFIG, SUPPLY_CONFIG } from '../core/config';
import { cellKey, findOwnedPath, hexDistance, ownedPathsFrom, parseCellKey } from '../core/hex';
import { Owner, Terrain, type ArmyMovement, type HexState } from '../core/types';

let movementId = 0;

type Arrival = (movement: ArmyMovement, target: HexState | null) => number | void;

function followPath(army: ArmyMovement, path: HexState[]): void {
  const from = path[0], next = path[1] ?? from;
  army.path = path.map(cellKey); army.pathIndex = path.length > 1 ? 1 : 0;
  army.toKey = cellKey(path[path.length - 1]);
  army.x0 = from.x; army.y0 = from.y; army.cx = from.x; army.cy = from.y;
  army.tx = next.x; army.ty = next.y;
  army.dist = Math.max(1, Math.hypot(next.x - from.x, next.y - from.y)); army.traveled = 0;
}

/** Excess remains a real convoy; it never exceeds the field cap or disappears. */
function settle(army: ArmyMovement, target: HexState | null, hexes: readonly HexState[], onArrival: Arrival): boolean {
  const remaining = onArrival(army, target) ?? 0;
  if (remaining <= 1e-9) return true;
  army.units = remaining;
  if (!target) return false;
  const destinations = hexes.filter((hex) => hex !== target && hex.owner === army.owner && hex.units < GAME_CONFIG.maxStack);
  const paths = destinations.length ? ownedPathsFrom(hexes, target) : new Map<string, HexState[]>();
  const routes = destinations.map((hex) => paths.get(cellKey(hex)))
    .filter((path): path is HexState[] => Boolean(path && path.length > 1))
    .sort((a, b) => a.length - b.length || cellKey(a[a.length - 1]).localeCompare(cellKey(b[b.length - 1])));
  army.kind = 'reinforcement'; army.returning = true;
  army.waiting = !routes.length;
  followPath(army, routes[0] ?? [target]);
  return false;
}

export function createMovement(
  from: HexState,
  to: HexState,
  owner: Owner,
  units: number,
  kind: ArmyMovement['kind'] = 'command',
  path: HexState[] = [from, to],
): ArmyMovement {
  const next = path[1] ?? to;
  const distance = Math.max(1, Math.hypot(next.x - from.x, next.y - from.y));
  return {
    id: ++movementId, owner, units,
    x0: from.x, y0: from.y, cx: from.x, cy: from.y,
    tx: next.x, ty: next.y, toKey: cellKey(to), dist: distance, traveled: 0,
    kind, path: path.map(cellKey), pathIndex: 1,
  };
}

export function updateMovements(
  armies: ArmyMovement[],
  hexes: readonly HexState[],
  deltaSeconds: number,
  onArrival: Arrival,
): void {
  const byKey = new Map(hexes.map((hex) => [cellKey(hex), hex]));
  for (let index = armies.length - 1; index >= 0; index -= 1) {
    const army = armies[index];
    if (army.waiting) {
      const target = byKey.get(army.toKey) ?? null;
      if (settle(army, target, hexes, onArrival)) armies.splice(index, 1);
      continue;
    }
    const speed = GAME_CONFIG.travelSpeed * (army.kind === 'supply' ? SUPPLY_CONFIG.transportSpeedMultiplier : 1);
    army.traveled += speed * deltaSeconds;
    if (army.traveled < army.dist) {
      const ratio = army.traveled / army.dist;
      army.cx = army.x0 + (army.tx - army.x0) * ratio;
      army.cy = army.y0 + (army.ty - army.y0) * ratio;
      continue;
    }
    const protectedRoute = army.kind === 'supply' || army.kind === 'reinforcement';
    const reached = byKey.get(army.path[army.pathIndex]);
    if (protectedRoute && (!reached || reached.owner !== army.owner)) {
      const fallback = army.path.slice(0, army.pathIndex).reverse().map((key) => byKey.get(key)).find((hex) => hex?.owner === army.owner) ?? null;
      // With no remaining friendly waypoint, the cut-off convoy fights where it arrived.
      if (settle(army, fallback ?? reached ?? null, hexes, onArrival)) armies.splice(index, 1);
      continue;
    }
    if (army.pathIndex < army.path.length - 1) {
      const next = byKey.get(army.path[army.pathIndex + 1]);
      if (protectedRoute && reached && (!next || next.owner !== army.owner)) {
        const goal = byKey.get(army.toKey);
        const opponent = army.owner === Owner.Player ? Owner.Enemy : Owner.Player;
        const targetBase = hexes.find((hex) => hex.owner === opponent && hex.terrain === Terrain.Base);
        const validReroute = goal?.owner === army.owner ? findOwnedPath(hexes, reached, goal,
          (from, to) => army.kind !== 'supply' || !targetBase || hexDistance(to, targetBase) <= hexDistance(from, targetBase)) : null;
        if (validReroute && validReroute.length > 1) {
          army.path = validReroute.map(cellKey); army.pathIndex = 1;
          army.x0 = reached.x; army.y0 = reached.y; army.cx = reached.x; army.cy = reached.y;
          army.tx = validReroute[1].x; army.ty = validReroute[1].y;
          army.dist = Math.max(1, Math.hypot(army.tx - reached.x, army.ty - reached.y)); army.traveled = 0;
          continue;
        }
        if (settle(army, reached, hexes, onArrival)) armies.splice(index, 1);
        continue;
      }
      if (!reached || !next) {
        if (settle(army, reached ?? byKey.get(army.path[0]) ?? null, hexes, onArrival)) armies.splice(index, 1);
        continue;
      }
      army.pathIndex += 1;
      army.x0 = reached.x; army.y0 = reached.y; army.cx = reached.x; army.cy = reached.y;
      army.tx = next.x; army.ty = next.y;
      army.dist = Math.max(1, Math.hypot(next.x - reached.x, next.y - reached.y));
      army.traveled = 0;
      continue;
    }
    const target = byKey.get(army.toKey) ?? (() => {
      const cell = parseCellKey(army.toKey);
      return hexes.find((hex) => hex.col === cell.col && hex.row === cell.row);
    })();
    if (protectedRoute && target?.owner !== army.owner) {
      const fallback = army.path.slice(0, army.pathIndex).reverse().map((key) => byKey.get(key)).find((hex) => hex?.owner === army.owner) ?? null;
      if (settle(army, fallback ?? target ?? null, hexes, onArrival)) armies.splice(index, 1);
    } else if (settle(army, target ?? null, hexes, onArrival)) armies.splice(index, 1);
  }
}
