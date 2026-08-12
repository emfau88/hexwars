import { GAME_CONFIG, SUPPLY_CONFIG } from '../core/config';
import { cellKey, findOwnedPath, parseCellKey } from '../core/hex';
import type { ArmyMovement, HexState, Owner } from '../core/types';

let movementId = 0;

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
  onArrival: (movement: ArmyMovement, target: HexState | null) => void,
): void {
  const byKey = new Map(hexes.map((hex) => [cellKey(hex), hex]));
  for (let index = armies.length - 1; index >= 0; index -= 1) {
    const army = armies[index];
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
      onArrival(army, fallback);
      armies.splice(index, 1);
      continue;
    }
    if (army.pathIndex < army.path.length - 1) {
      const next = byKey.get(army.path[army.pathIndex + 1]);
      if (protectedRoute && reached && (!next || next.owner !== army.owner)) {
        const goal = byKey.get(army.toKey);
        const reroute = goal?.owner === army.owner ? findOwnedPath(hexes, reached, goal) : null;
        if (reroute && reroute.length > 1) {
          army.path = reroute.map(cellKey); army.pathIndex = 1;
          army.x0 = reached.x; army.y0 = reached.y; army.cx = reached.x; army.cy = reached.y;
          army.tx = reroute[1].x; army.ty = reroute[1].y;
          army.dist = Math.max(1, Math.hypot(army.tx - reached.x, army.ty - reached.y)); army.traveled = 0;
          continue;
        }
        onArrival(army, reached); armies.splice(index, 1); continue;
      }
      if (!reached || !next) {
        onArrival(army, null);
        armies.splice(index, 1);
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
      onArrival(army, fallback);
    } else onArrival(army, target ?? null);
    armies.splice(index, 1);
  }
}
