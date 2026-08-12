import { GAME_CONFIG } from '../core/config';
import { isPlayable } from '../core/hex';
import { Owner, Terrain, type ArmyMovement, type HexState } from '../core/types';
import type { RandomSource } from '../core/random';

export function defenseMultiplier(hex: HexState): number {
  if (hex.terrain === Terrain.Hill) return 0.65;
  if (hex.terrain === Terrain.Base) return 0.82;
  return 1;
}

export function resolveArrival(movement: ArmyMovement, target: HexState | null): void {
  if (!target || !isPlayable(target)) return;
  if (target.owner === movement.owner) {
    target.units = Math.min(GAME_CONFIG.maxStack, target.units + movement.units);
    target.flash = 0.15;
    return;
  }
  target.siege ??= {};
  target.siege[movement.owner] = (target.siege[movement.owner] ?? 0) + movement.units;
  target.flash = 0.18;
}

export function updateCombat(
  hexes: readonly HexState[],
  deltaSeconds: number,
  random: RandomSource,
  onCapture: (hex: HexState, oldOwner: Owner, newOwner: Owner) => void,
): void {
  for (const hex of hexes) {
    if (!hex.siege) continue;
    for (const ownerKey of Object.keys(hex.siege)) {
      const attacker = Number(ownerKey) as Owner;
      let attackingUnits = hex.siege[attacker] ?? 0;
      if (attacker === hex.owner) {
        hex.units += attackingUnits;
        delete hex.siege[attacker];
        continue;
      }
      if (attackingUnits <= 0.001) {
        delete hex.siege[attacker];
        continue;
      }
      if (hex.units <= 0.001) {
        const oldOwner = hex.owner;
        hex.owner = attacker; hex.units = Math.max(1, attackingUnits); hex.siege = null; hex.flash = 0.4;
        onCapture(hex, oldOwner, attacker);
        break;
      }
      const clash = Math.min(attackingUnits, hex.units, GAME_CONFIG.battleRate * deltaSeconds);
      attackingUnits -= clash;
      hex.units -= clash * defenseMultiplier(hex);
      hex.siege[attacker] = attackingUnits;
      random();
      if (hex.units <= 0.001 && attackingUnits > 0.001) {
        const oldOwner = hex.owner;
        hex.owner = attacker; hex.units = Math.max(1, attackingUnits); hex.siege = null; hex.flash = 0.4;
        onCapture(hex, oldOwner, attacker);
        break;
      }
      if (attackingUnits <= 0.001) delete hex.siege[attacker];
    }
    if (hex.siege && Object.keys(hex.siege).length === 0) hex.siege = null;
  }
}
