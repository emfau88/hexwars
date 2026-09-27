import type { MissionResult } from '../core/types';

export interface PortalRuntime {
  pauseForAd(): void;
  resumeAfterAd(): void;
}

export interface PortalMissionResult {
  result: MissionResult;
  levelIndex: number;
  elapsedSeconds: number;
}

export interface PortalAdapter {
  initialize(runtime: PortalRuntime): void;
  missionStarted(levelIndex: number): void;
  missionCompleted(result: PortalMissionResult): void;
}

export const NOOP_PORTAL_ADAPTER: PortalAdapter = {
  initialize: () => undefined,
  missionStarted: () => undefined,
  missionCompleted: () => undefined,
};
