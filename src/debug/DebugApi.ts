import type { GameState } from '../core/GameState';
import { Owner, type HexState } from '../core/types';

export interface HexfrontDebugApi {
  startLevel(index?: number): void;
  showMap(): void;
  setAutoplay(value: boolean): void;
  setOpponentEnabled(value: boolean): void;
  getState(): ReturnType<GameState['snapshot']> & { progress: unknown };
  getBoard(): Array<Pick<HexState, 'col' | 'row' | 'owner' | 'units' | 'terrain' | 'decor' | 'x' | 'y'>>;
  send(fromCol: number, fromRow: number, toCol: number, toRow: number, fraction?: number): boolean;
  think(owner?: Owner): number;
  simulate(seconds?: number, step?: number): ReturnType<GameState['snapshot']>;
  debugWin(): void;
  resetProgress(): void;
}

declare global { interface Window { __HEXFRONT__?: HexfrontDebugApi } }

export function installDebugApi(api: HexfrontDebugApi): () => void {
  window.__HEXFRONT__ = api;
  return () => { delete window.__HEXFRONT__; };
}
