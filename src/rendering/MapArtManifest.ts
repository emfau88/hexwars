import { REFERENCE_WORLD_HEIGHT, REFERENCE_WORLD_WIDTH } from './WorldGeometry';

const ASSET_BASE = import.meta.env?.BASE_URL ?? './';

export interface MapArtManifest {
  levelIndex: number;
  core: MapArtAsset;
  worldRect: { x: number; y: number; width: number; height: number };
  landscapeOverlays?: readonly PositionedMapArtAsset[];
  structureSafeAreas: readonly { kind: 'hq' | 'guardian' | 'relay' | 'node'; col: number; row: number; radius: number }[];
  backdrop: readonly [string, string, string, string];
  fog: string;
  waterFrames?: readonly MapArtAsset[];
  waterOverlayAlpha?: number;
  waterCycleSeconds?: number;
}

export interface MapArtAsset {
  source: string;
  sourceWidth: number;
  sourceHeight: number;
}

export interface PositionedMapArtAsset extends MapArtAsset {
  worldRect: { x: number; y: number; width: number; height: number };
}

export interface SourceCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const LEVEL_ONE_MAP_ART = Object.freeze({
  levelIndex: 0,
  core: {
    source: `${ASSET_BASE}assets/maps/level01-core-v1.png`,
    sourceWidth: 1438,
    sourceHeight: 1093,
  },
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 3, radius: 35 },
    { kind: 'hq', col: 3, row: 9, radius: 35 },
  ],
  backdrop: ['#2f6870', '#78977a', '#91a86f', '#536f54'],
  fog: '229,237,220',
} as const satisfies MapArtManifest);

export const LEVEL_TWO_MAP_ART = Object.freeze({
  levelIndex: 1,
  core: {
    source: `${ASSET_BASE}assets/maps/level02-core-v5.png`,
    sourceWidth: 1438,
    sourceHeight: 1093,
  },
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 1, radius: 35 },
    { kind: 'hq', col: 3, row: 11, radius: 35 },
  ],
  backdrop: ['#245f6c', '#5f8f77', '#8aa668', '#496e54'],
  fog: '218,231,216',
  waterFrames: [
    { source: `${ASSET_BASE}assets/maps/level02-water-low-v3.png`, sourceWidth: 1438, sourceHeight: 1093 },
    { source: `${ASSET_BASE}assets/maps/level02-water-high-v3.png`, sourceWidth: 1438, sourceHeight: 1093 },
  ],
  waterOverlayAlpha: .58,
  waterCycleSeconds: 7,
} as const satisfies MapArtManifest);

export const LEVEL_THREE_MAP_ART = Object.freeze({
  levelIndex: 2,
  core: {
    source: `${ASSET_BASE}assets/maps/level03-core-v1.webp`,
    sourceWidth: 1438,
    sourceHeight: 1093,
  },
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 1, radius: 35 },
    { kind: 'hq', col: 3, row: 11, radius: 35 },
  ],
  backdrop: ['#355f48', '#79935b', '#a49a68', '#4c6b4d'],
  fog: '224,231,210',
} as const satisfies MapArtManifest);

export const LEVEL_FOUR_MAP_ART = Object.freeze({
  levelIndex: 3,
  core: {
    source: `${ASSET_BASE}assets/maps/level04-core-v1.webp`,
    sourceWidth: 1438,
    sourceHeight: 1093,
  },
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 1, radius: 35 },
    { kind: 'hq', col: 3, row: 11, radius: 35 },
  ],
  backdrop: ['#3d5e49', '#7e8754', '#a3925b', '#53634b'],
  fog: '224,226,211',
} as const satisfies MapArtManifest);

export const LEVEL_FIVE_MAP_ART = Object.freeze({
  levelIndex: 4,
  core: {
    source: `${ASSET_BASE}assets/maps/level05-core-v1.webp`,
    sourceWidth: 1438,
    sourceHeight: 1093,
  },
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  landscapeOverlays: [{
    source: `${ASSET_BASE}assets/maps/level05-central-massif-v1.webp`,
    sourceWidth: 1024,
    sourceHeight: 1536,
    // The opaque content maps exactly across the seven central decor cells:
    // (3,4), (3,5), (2,6), (3,6), (4,6), (3,7), (3,8).
    worldRect: { x: 418, y: 235, width: 241, height: 371 },
  }],
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 1, radius: 35 },
    { kind: 'guardian', col: 1, row: 4, radius: 31.4 },
    { kind: 'guardian', col: 5, row: 4, radius: 31.4 },
    { kind: 'hq', col: 3, row: 11, radius: 35 },
  ],
  backdrop: ['#455c46', '#77875a', '#9a915c', '#4a6049'],
  fog: '225,229,211',
} as const satisfies MapArtManifest);

export const LEVEL_SIX_MAP_ART = Object.freeze({
  levelIndex: 5,
  core: {
    source: `${ASSET_BASE}assets/maps/level06-core-v1.webp`,
    sourceWidth: 1438,
    sourceHeight: 1093,
  },
  worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  landscapeOverlays: [{
    source: `${ASSET_BASE}assets/maps/level06-central-wetland-v3.webp`,
    sourceWidth: 1108,
    sourceHeight: 842,
    // Six central decor cells, staggered with the odd rows:
    // (3,3), (3,4), (3,5), (3,6), (3,7), (3,8).
    worldRect: { x: 0, y: 0, width: REFERENCE_WORLD_WIDTH, height: REFERENCE_WORLD_HEIGHT },
  }],
  structureSafeAreas: [
    { kind: 'hq', col: 3, row: 1, radius: 35 },
    { kind: 'guardian', col: 2, row: 4, radius: 31.4 },
    { kind: 'hq', col: 3, row: 11, radius: 35 },
  ],
  backdrop: ['#456e70', '#779765', '#9da367', '#4d6d57'],
  fog: '218,229,210',
} as const satisfies MapArtManifest);

export const MAP_ART_MANIFESTS: readonly MapArtManifest[] = Object.freeze([
  LEVEL_ONE_MAP_ART,
  LEVEL_TWO_MAP_ART,
  LEVEL_THREE_MAP_ART,
  LEVEL_FOUR_MAP_ART,
  LEVEL_FIVE_MAP_ART,
  LEVEL_SIX_MAP_ART,
]);

export function mapArtForLevel(levelIndex: number): MapArtManifest | null {
  return MAP_ART_MANIFESTS.find((manifest) => manifest.levelIndex === levelIndex) ?? null;
}

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
