import { GAME_CONFIG } from '../core/config';
import { isPlayable } from '../core/hex';
import { Owner, Terrain, type HexState } from '../core/types';

export function terrainCapacity(hex: HexState): number {
  if (hex.terrain === Terrain.Base) return 50;
  if (hex.terrain === Terrain.Hill) return 44;
  if (hex.terrain === Terrain.Relay) return 43;
  return GAME_CONFIG.baseCap;
}

export function terrainRegeneration(hex: HexState): number {
  if (hex.terrain === Terrain.Base) return 0.56;
  if (hex.terrain === Terrain.Hill) return 0.3;
  if (hex.terrain === Terrain.Relay) return 0.38;
  return 0.42;
}

export function regenerationScale(elapsed: number): number {
  if (elapsed <= GAME_CONFIG.endgameStart) return 1;
  return 1 - Math.max(0, Math.min(1, (elapsed - GAME_CONFIG.endgameStart) / GAME_CONFIG.endgameFade));
}

export function updateGrowth(hexes: readonly HexState[], elapsed: number, deltaSeconds: number): void {
  const scale = regenerationScale(elapsed);
  for (const hex of hexes) {
    hex.flash = Math.max(0, hex.flash - deltaSeconds);
    if (hex.owner === Owner.Neutral || !isPlayable(hex) || hex.siege) continue;
    const capacity = terrainCapacity(hex);
    if (hex.units < capacity) {
      hex.units = Math.min(capacity, hex.units + terrainRegeneration(hex) * scale * deltaSeconds);
    }
  }
}

