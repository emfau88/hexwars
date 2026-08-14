import { ENEMY_BASE, PLAYER_BASE } from '../core/config';
import { cellKey } from '../core/hex';
import { Owner, type ArmyMovement, type Cell, type HexState, type MissionResult, type ResultReason } from '../core/types';

export interface VictoryEvaluation {
  result: MissionResult;
  reason: ResultReason;
}

function sideAlive(owner: Owner, hexes: readonly HexState[], armies: readonly ArmyMovement[]): boolean {
  return hexes.some((hex) => hex.owner === owner)
    || armies.some((army) => army.owner === owner)
    || hexes.some((hex) => (hex.siege?.[owner] ?? 0) > 0);
}

export function evaluateVictory(
  hexes: readonly HexState[],
  armies: readonly ArmyMovement[],
  bases: { player: Cell; enemy: Cell } = { player: PLAYER_BASE, enemy: ENEMY_BASE },
): VictoryEvaluation | null {
  const byKey = new Map(hexes.map((hex) => [cellKey(hex), hex]));
  if (byKey.get(cellKey(bases.enemy))?.owner === Owner.Player) return { result: 'victory', reason: 'enemyBaseCaptured' };
  if (byKey.get(cellKey(bases.player))?.owner === Owner.Enemy) return { result: 'defeat', reason: 'playerBaseCaptured' };
  if (!sideAlive(Owner.Player, hexes, armies)) return { result: 'defeat', reason: 'playerEliminated' };
  if (!sideAlive(Owner.Enemy, hexes, armies)) return { result: 'victory', reason: 'enemyEliminated' };
  return null;
}
