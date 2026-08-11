export const HEX_DIRECTIONS = [
  { q: 1, r: 0 },
  { q: 1, r: -1 },
  { q: 0, r: -1 },
  { q: -1, r: 0 },
  { q: -1, r: 1 },
  { q: 0, r: 1 },
];

export function hexKey(qOrHex, maybeR) {
  const q = typeof qOrHex === "object" ? qOrHex.q : qOrHex;
  const r = typeof qOrHex === "object" ? qOrHex.r : maybeR;
  return `${q},${r}`;
}

export function parseHexKey(key) {
  const [q, r] = key.split(",").map(Number);
  return { q, r };
}

export function hexDistance(a, b) {
  const dq = a.q - b.q;
  const dr = a.r - b.r;
  const ds = -a.q - a.r + b.q + b.r;
  return (Math.abs(dq) + Math.abs(dr) + Math.abs(ds)) / 2;
}

export function hexNeighbors(hex) {
  return HEX_DIRECTIONS.map((direction) => ({
    q: hex.q + direction.q,
    r: hex.r + direction.r,
  }));
}

export function createHexBoard(radius, terrain = {}) {
  const board = new Map();

  for (let q = -radius; q <= radius; q += 1) {
    const rMin = Math.max(-radius, -q - radius);
    const rMax = Math.min(radius, -q + radius);

    for (let r = rMin; r <= rMax; r += 1) {
      const key = hexKey(q, r);
      board.set(key, {
        q,
        r,
        terrain: terrain[key] ?? "plain",
        fire: 0,
      });
    }
  }

  return board;
}

export function isTraversable(tile) {
  return Boolean(tile) && tile.terrain !== "water";
}

export function getReachableHexes(board, start, maxDistance, blocked = new Set()) {
  const startKey = hexKey(start);
  const distance = new Map([[startKey, 0]]);
  const frontier = [start];

  while (frontier.length) {
    const current = frontier.shift();
    const currentDistance = distance.get(hexKey(current));

    if (currentDistance >= maxDistance) continue;

    for (const next of hexNeighbors(current)) {
      const key = hexKey(next);
      if (distance.has(key) || blocked.has(key) || !isTraversable(board.get(key))) continue;
      distance.set(key, currentDistance + 1);
      frontier.push(next);
    }
  }

  distance.delete(startKey);
  return distance;
}

export function chooseAdvanceHex(board, start, targets, maxDistance, blocked = new Set()) {
  const reachable = getReachableHexes(board, start, maxDistance, blocked);
  let best = null;
  let bestScore = Number.POSITIVE_INFINITY;

  for (const [key, moveCost] of reachable) {
    const hex = parseHexKey(key);
    const tile = board.get(key);
    const targetDistance = Math.min(...targets.map((target) => hexDistance(hex, target)));
    const hazardPenalty = tile.fire > 0 ? 8 : 0;
    const score = targetDistance * 10 + moveCost + hazardPenalty;

    if (score < bestScore || (score === bestScore && key < hexKey(best ?? start))) {
      best = hex;
      bestScore = score;
    }
  }

  return best;
}

export function igniteTile(board, hex, duration = 2) {
  const tile = board.get(hexKey(hex));
  if (!tile || tile.terrain === "water" || tile.terrain.startsWith("core")) return false;
  tile.fire = Math.max(tile.fire, duration);
  return true;
}

export function advanceFire(board, units) {
  const burning = [...board.values()].filter((tile) => tile.fire > 0);
  const spreadTargets = new Set();
  const damagedUnits = [];

  for (const tile of burning) {
    const occupant = units.find((unit) => unit.hp > 0 && unit.q === tile.q && unit.r === tile.r);
    if (occupant) {
      occupant.hp -= 1;
      damagedUnits.push(occupant.id);
    }

    for (const neighbor of hexNeighbors(tile)) {
      const neighborTile = board.get(hexKey(neighbor));
      if (neighborTile?.terrain === "forest" && neighborTile.fire === 0) {
        spreadTargets.add(hexKey(neighbor));
      }
    }

    tile.fire -= 1;
    if (tile.fire === 0 && tile.terrain === "forest") tile.terrain = "scorched";
  }

  for (const key of spreadTargets) {
    board.get(key).fire = 2;
  }

  return {
    damagedUnits,
    ignited: [...spreadTargets],
  };
}
