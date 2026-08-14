import { ENEMY_BASE, GAME_CONFIG, PLAYER_BASE } from '../core/config';
import { cellKey, isPlayable } from '../core/hex';
import { hash01, type RandomSource } from '../core/random';
import { Owner, Terrain, type DecorType, type HexState, type LevelDefinition, type Point } from '../core/types';
import { LEVELS } from './index';

function decorTypeFor(hex: HexState, level: LevelDefinition): DecorType {
  if (hex.decor) return hex.decor;
  const q = hash01(hex.col, hex.row, level.seed);
  const { col, row } = hex;
  switch (level.theme) {
    case 'meadow':
      if (col <= 1 && row >= 4 && row <= 7) return 'water';
      if (col >= 5 && row >= 2 && row <= 6) return 'forest';
      if (col <= 1 && row >= 9) return 'forest';
      return q < 0.08 ? 'ruin' : 'meadow';
    case 'river':
      if (col === 3 && row >= 3 && row <= 9) return row % 3 === 0 ? 'forest' : 'water';
      if (col <= 1 && row >= 7) return 'water';
      return q < 0.26 ? 'forest' : q < 0.32 ? 'ruin' : 'meadow';
    case 'ruins': return q < .22 ? 'ruin' : q < .38 ? 'forest' : q < .45 ? 'water' : 'meadow';
    case 'highland': return q < .30 ? 'mountain' : q < .50 ? 'forest' : 'meadow';
    case 'passes': return q < .42 ? 'mountain' : q < .61 ? 'forest' : 'meadow';
    case 'marsh': return q < .28 ? 'marsh' : q < .46 ? 'water' : q < .62 ? 'forest' : 'meadow';
    case 'island': return q < .24 ? 'water' : q < .45 ? 'forest' : q < .53 ? 'ruin' : 'meadow';
    case 'garden': return q < .34 ? 'forest' : q < .46 ? 'ruin' : q < .55 ? 'water' : 'meadow';
    case 'snow': return q < .40 ? 'snow' : q < .68 ? 'mountain' : q < .82 ? 'forest' : 'water';
    default: return q < .22 ? 'forest' : q < .38 ? 'mountain' : q < .49 ? 'ruin' : q < .60 ? 'water' : 'meadow';
  }
}

export function buildLevel(
  levelIndex: number,
  random: RandomSource,
  positionFor: (col: number, row: number) => Point = () => ({ x: 0, y: 0 }),
): HexState[] {
  const level = LEVELS[levelIndex] ?? LEVELS[0];
  const state: HexState[] = [];
  for (let row = 0; row < level.rows; row += 1) {
    for (let col = 0; col < level.cols; col += 1) {
      state.push({ col, row, ...positionFor(col, row), owner: Owner.Neutral, units: 0, terrain: Terrain.Decor, decor: null, siege: null, flash: 0, fixedUnits: null });
    }
  }
  const at = (col: number, row: number) => state.find((hex) => hex.col === col && hex.row === row);
  level.activeRows.forEach((columns, row) => columns.forEach((col) => {
    const hex = at(col, row);
    if (hex) { hex.terrain = Terrain.Normal; hex.decor = null; }
  }));
  level.cells?.forEach((definition) => {
    const hex = at(definition.col, definition.row);
    if (!hex) return;
    if (definition.terrain !== undefined) hex.terrain = definition.terrain;
    if (definition.units !== undefined) hex.fixedUnits = definition.units;
    if (definition.decor !== undefined) hex.decor = definition.decor;
  });
  for (const hex of state) if (hex.terrain === Terrain.Decor) hex.decor = decorTypeFor(hex, level);
  const bases = level.bases ?? { player: PLAYER_BASE, enemy: ENEMY_BASE };
  const playerBase = at(bases.player.col, bases.player.row);
  const enemyBase = at(bases.enemy.col, bases.enemy.row);
  if (!playerBase || !enemyBase) throw new Error(`Level ${level.id} is missing a base cell.`);
  const baseUnits = level.baseUnits ?? { player: GAME_CONFIG.startUnits, enemy: GAME_CONFIG.startUnits };
  Object.assign(playerBase, { terrain: Terrain.Base, decor: null, owner: Owner.Player, units: baseUnits.player });
  Object.assign(enemyBase, { terrain: Terrain.Base, decor: null, owner: Owner.Enemy, units: baseUnits.enemy });
  const mirroredUnits = new Map<string, number>();
  for (const hex of state) {
    if (!isPlayable(hex) || hex.owner !== Owner.Neutral) continue;
    const mirrorKey = `${hex.col},${level.rows - 1 - hex.row}`;
    const [minimum, maximum] = level.neutralUnits;
    hex.units = hex.fixedUnits ?? (level.mirrorNeutral && mirroredUnits.has(mirrorKey)
      ? mirroredUnits.get(mirrorKey) ?? minimum
      : Math.floor(minimum + random() * (maximum - minimum + 1)));
    if (hex.terrain === Terrain.Hill && hex.fixedUnits === null) hex.units += 2;
    if (hex.terrain === Terrain.Relay && hex.fixedUnits === null) hex.units += 2;
    mirroredUnits.set(cellKey(hex), hex.units);
  }
  return state;
}
