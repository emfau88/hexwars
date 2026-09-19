import { REFERENCE_WORLD_HEIGHT, REFERENCE_WORLD_WIDTH } from './WorldGeometry';

const ASSET_BASE = import.meta.env?.BASE_URL ?? './';

export interface MapArtManifest {
  levelIndex: number;
  source: string;
  sourceWidth: number;
  sourceHeight: number;
  worldRect: { x: number; y: number; width: number; height: number };
  structureSafeAreas: readonly { kind: 'hq'; col: number; row: number; radius: number }[];
}

export interface SourceCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const LEVEL_ONE_MAP_ART = Object.freeze({
  levelIndex: 0,
  source: `${ASSET_BASE}assets/maps/level01-core-v1.png`,
  sourceWidth: 1438,
  sourceHeight: 1093,
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 3, radius: 35 },
    { kind: 'hq', col: 3, row: 9, radius: 35 },
  ],
} as const satisfies MapArtManifest);

/** Returns a centered source crop with exactly the destination aspect ratio. */
export function centeredAspectCrop(
  sourceWidth: number,
  sourceHeight: number,
  destinationWidth: number,
  destinationHeight: number,
): SourceCrop {
  const sourceAspect = sourceWidth / sourceHeight;
  const destinationAspect = destinationWidth / destinationHeight;
  if (sourceAspect > destinationAspect) {
    const width = sourceHeight * destinationAspect;
    return { x: (sourceWidth - width) / 2, y: 0, width, height: sourceHeight };
  }
  const height = sourceWidth / destinationAspect;
  return { x: 0, y: (sourceHeight - height) / 2, width: sourceWidth, height };
}
