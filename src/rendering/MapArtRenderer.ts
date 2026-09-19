import { hash01 } from '../core/random';
import { centeredAspectCrop, mapArtForLevel, type MapArtAsset, type MapArtManifest, type PositionedMapArtAsset } from './MapArtManifest';
import type { WorldGeometry, WorldTransform } from './WorldGeometry';

export const MAP_ART_RENDER_LAYERS = Object.freeze([
  'backdrop-bleed', 'map-core', 'water', 'shore', 'atmosphere', 'grid',
  'territory-selection', 'structures', 'units-movement', 'gameplay-fx',
]);

export interface MapArtStatus {
  enabled: boolean;
  loaded: boolean;
  sourceWidth: number;
  sourceHeight: number;
  sourceCrop: { x: number; y: number; width: number; height: number };
  waterFrames: number;
  loadedWaterFrames: number;
}

interface LoadedAsset {
  definition: MapArtAsset;
  image: HTMLImageElement;
  loaded: boolean;
}

interface LoadedMapArt {
  manifest: MapArtManifest;
  core: LoadedAsset;
  landscapeOverlays: LoadedPositionedAsset[];
  water: LoadedAsset[];
}

interface LoadedPositionedAsset extends LoadedAsset {
  definition: PositionedMapArtAsset;
}

export class MapArtRenderer {
  private readonly loaded = new Map<number, LoadedMapArt>();

  constructor(private readonly onAssetReady?: () => void) {}

  supports(levelIndex: number): boolean { return mapArtForLevel(levelIndex) !== null; }

  status(levelIndex: number): MapArtStatus {
    const manifest = mapArtForLevel(levelIndex);
    if (!manifest) return {
      enabled: false, loaded: false, sourceWidth: 0, sourceHeight: 0,
      sourceCrop: { x: 0, y: 0, width: 0, height: 0 }, waterFrames: 0, loadedWaterFrames: 0,
    };
    const loaded = this.ensure(levelIndex);
    const width = loaded.core.image.naturalWidth || manifest.core.sourceWidth;
    const height = loaded.core.image.naturalHeight || manifest.core.sourceHeight;
    return {
      enabled: true, loaded: loaded.core.loaded && loaded.landscapeOverlays.every(({ loaded: ready }) => ready),
      sourceWidth: width, sourceHeight: height,
      sourceCrop: centeredAspectCrop(width, height, manifest.worldRect.width, manifest.worldRect.height),
      waterFrames: loaded.water.length,
      loadedWaterFrames: loaded.water.filter(({ loaded: ready }) => ready).length,
    };
  }

  drawBackdrop(context: CanvasRenderingContext2D, width: number, height: number, levelIndex: number): void {
    const manifest = mapArtForLevel(levelIndex);
    if (!manifest) return;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, manifest.backdrop[0]);
    gradient.addColorStop(.28, manifest.backdrop[1]);
    gradient.addColorStop(.66, manifest.backdrop[2]);
    gradient.addColorStop(1, manifest.backdrop[3]);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);

    context.save();
    context.globalAlpha = .12;
    for (let index = 0; index < 12; index += 1) {
      const q = hash01(index, 17, 101);
      const x = width * (.08 + q * .84);
      const y = height * (.08 + hash01(index, 23, 101) * .84);
      const radius = Math.max(width, height) * (.08 + hash01(index, 31, 101) * .08);
      const patch = context.createRadialGradient(x, y, 0, x, y, radius);
      patch.addColorStop(0, index % 3 === 0 ? 'rgba(25,68,67,.52)' : 'rgba(39,72,43,.42)');
      patch.addColorStop(1, 'rgba(39,72,43,0)');
      context.fillStyle = patch;
      context.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    }
    context.restore();
  }

  drawCore(context: CanvasRenderingContext2D, levelIndex: number): boolean {
    const entry = this.ensure(levelIndex);
    if (!entry.core.loaded) return false;
    this.drawAsset(context, entry.core, entry.manifest.worldRect);
    for (const overlay of entry.landscapeOverlays) {
      if (!overlay.loaded) return false;
      this.drawPositionedAsset(context, overlay);
    }
    return true;
  }

  drawWaterMotion(
    context: CanvasRenderingContext2D,
    levelIndex: number,
    phase: number,
  ): boolean {
    const entry = this.ensure(levelIndex);
    const frames = entry.water.filter(({ loaded }) => loaded);
    if (!frames.length) return false;
    const cycle = entry.manifest.waterCycleSeconds ?? 12;
    const blend = frames.length > 1 ? .5 - Math.cos((phase / cycle) * Math.PI * 2) * .5 : 0;
    const alpha = entry.manifest.waterOverlayAlpha ?? .22;
    context.save();
    context.globalAlpha = alpha * (frames.length > 1 ? 1 - blend : 1);
    this.drawAsset(context, frames[0], entry.manifest.worldRect);
    if (frames.length > 1) {
      context.globalAlpha = alpha * blend;
      this.drawAsset(context, frames[1], entry.manifest.worldRect);
    }
    context.restore();
    return true;
  }

  drawAtmosphere(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    runtime: WorldGeometry,
    phase: number,
    levelIndex: number,
  ): void {
    const manifest = mapArtForLevel(levelIndex);
    if (!manifest) return;
    const fogColor = manifest.fog;
    // Keep the playable board clear. A wider exclusion zone also prevents the
    // atmosphere from reading as a hard, vertical frame beside the board.
    const margin = Math.max(18, runtime.radius * 1.25);
    const safe = {
      x: runtime.bounds.x - margin,
      y: runtime.bounds.y - margin,
      width: runtime.bounds.width + margin * 2,
      height: runtime.bounds.height + margin * 2,
    };
    context.save();
    context.beginPath();
    context.rect(0, 0, width, height);
    context.rect(safe.x, safe.y, safe.width, safe.height);
    context.clip('evenodd');
    const topFog = context.createLinearGradient(0, 0, 0, Math.max(1, safe.y));
    topFog.addColorStop(0, `rgba(${fogColor},.5)`); topFog.addColorStop(1, `rgba(${fogColor},0)`);
    context.fillStyle = topFog; context.fillRect(0, 0, width, Math.max(0, safe.y));
    const bottomStart = safe.y + safe.height;
    const bottomFog = context.createLinearGradient(0, bottomStart, 0, height);
    bottomFog.addColorStop(0, `rgba(${fogColor},0)`); bottomFog.addColorStop(1, `rgba(${fogColor},.52)`);
    context.fillStyle = bottomFog; context.fillRect(0, bottomStart, width, Math.max(0, height - bottomStart));
    // Side fog is intentionally radial only: horizontal linear gradients made
    // their start/end points visible as vertical bands on brighter maps.
    context.globalAlpha = .26;
    const drift = Math.sin(phase * .12) * Math.min(width, height) * .018;
    const fogClouds = [
      { x: -width * .16 + drift, y: height * .22, radius: Math.max(220, height * .58) },
      { x: width * 1.16 - drift, y: height * .3, radius: Math.max(220, height * .62) },
      { x: width * .24, y: height * 1.12 + drift, radius: Math.max(190, width * .29) },
      { x: width * .78, y: -height * .12 - drift, radius: Math.max(190, width * .27) },
    ];
    for (const cloud of fogClouds) {
      const gradient = context.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
      gradient.addColorStop(0, `rgba(${fogColor},.82)`);
      gradient.addColorStop(.55, `rgba(${fogColor},.38)`);
      gradient.addColorStop(1, `rgba(${fogColor},0)`);
      context.fillStyle = gradient;
      context.fillRect(cloud.x - cloud.radius, cloud.y - cloud.radius, cloud.radius * 2, cloud.radius * 2);
    }
    context.restore();
  }

  coreScreenRect(transform: WorldTransform, levelIndex: number): { x: number; y: number; width: number; height: number } {
    const rect = mapArtForLevel(levelIndex)?.worldRect ?? { x: 0, y: 0, width: 0, height: 0 };
    return {
      x: rect.x * transform.scale + transform.translateX,
      y: rect.y * transform.scale + transform.translateY,
      width: rect.width * transform.scale,
      height: rect.height * transform.scale,
    };
  }

  private ensure(levelIndex: number): LoadedMapArt {
    const existing = this.loaded.get(levelIndex);
    if (existing) return existing;
    const manifest = mapArtForLevel(levelIndex);
    if (!manifest) throw new Error(`Level ${levelIndex + 1} has no map-art manifest.`);
    const entry: LoadedMapArt = {
      manifest,
      core: this.loadAsset(manifest.core),
      landscapeOverlays: (manifest.landscapeOverlays ?? []).map((asset) => this.loadAsset(asset) as LoadedPositionedAsset),
      water: (manifest.waterFrames ?? []).map((asset) => this.loadAsset(asset)),
    };
    this.loaded.set(levelIndex, entry);
    return entry;
  }

  private loadAsset(definition: MapArtAsset): LoadedAsset {
    const asset: LoadedAsset = { definition, image: new Image(), loaded: false };
    asset.image.addEventListener('load', () => {
      asset.loaded = asset.image.naturalWidth > 0;
      this.onAssetReady?.();
    }, { once: true });
    asset.image.src = definition.source;
    return asset;
  }

  private drawAsset(
    context: CanvasRenderingContext2D,
    asset: LoadedAsset,
    rect: { x: number; y: number; width: number; height: number },
  ): void {
    const crop = centeredAspectCrop(asset.image.naturalWidth, asset.image.naturalHeight, rect.width, rect.height);
    context.drawImage(asset.image, crop.x, crop.y, crop.width, crop.height, rect.x, rect.y, rect.width, rect.height);
  }

  private drawPositionedAsset(context: CanvasRenderingContext2D, asset: LoadedPositionedAsset): void {
    const { x, y, width, height } = asset.definition.worldRect;
    context.drawImage(asset.image, 0, 0, asset.image.naturalWidth, asset.image.naturalHeight, x, y, width, height);
  }
}
