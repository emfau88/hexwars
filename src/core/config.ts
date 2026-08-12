import type { Cell } from './types';

export const GAME_CONFIG = Object.freeze({
  baseCap: 42,
  travelSpeed: 205,
  battleRate: 14,
  startUnits: 23,
  relayRange: 2,
  maxStack: 68,
  endgameStart: 180,
  endgameFade: 60,
});

export const SUPPLY_CONFIG = Object.freeze({
  enabled: true,
  garrisonRatio: 0.2,
  minimumGarrison: 6,
  dispatchThreshold: 1,
  dispatchIntervalSeconds: 1.4,
  transportSpeedMultiplier: 0.72,
  focusWeight: 3,
});

export const WORLD_COLS = 7;
export const WORLD_ROWS = 13;
export const PLAYER_BASE: Cell = Object.freeze({ col: 3, row: 11 });
export const ENEMY_BASE: Cell = Object.freeze({ col: 3, row: 1 });
export const SAVE_KEY = 'hexfront_campaign_progress_v2';
