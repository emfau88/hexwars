import { hash01 } from '../core/random';
import { Terrain, type HexState } from '../core/types';
import { centeredAspectCrop, LEVEL_ONE_MAP_ART } from './MapArtManifest';
import type { WorldGeometry, WorldTransform } from './WorldGeometry';

export const LEVEL_ONE_RENDER_LAYERS = Object.freeze([
  'backdrop-bleed', 'map-core', 'water', 'shore', 'atmosphere', 'grid',
  'territory-selection', 'structures', 'units-movement', 'gameplay-fx',
]);

export interface MapArtStatus {
  enabled: boolean;
  loaded: boolean;
  sourceWidth: number;
  sourceHeight: number;
  sourceCrop: { x: number; y: number; width: number; height: number };
}

export class MapArtRenderer {
  private readonly core = new Image();
  private loaded = false;

  constructor(onAssetReady?: () => void) {
    this.core.addEventListener('load', () => {
      this.loaded = this.core.naturalWidth > 0;
      onAssetReady?.();
    }, { once: true });
    this.core.src = LEVEL_ONE_MAP_ART.source;
  }

  supports(levelIndex: number): boolean { return levelIndex === LEVEL_ONE_MAP_ART.levelIndex; }

  status(levelIndex: number): MapArtStatus {
    const width = this.core.naturalWidth || LEVEL_ONE_MAP_ART.sourceWidth;
    const height = this.core.naturalHeight || LEVEL_ONE_MAP_ART.sourceHeight;
    return {
      enabled: this.supports(levelIndex), loaded: this.loaded,
      sourceWidth: width, sourceHeight: height,
      sourceCrop: centeredAspectCrop(width, height, LEVEL_ONE_MAP_ART.worldRect.width, LEVEL_ONE_MAP_ART.worldRect.height),
    };
  }

  drawBackdrop(context: CanvasRenderingContext2D, width: number, height: number): void {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#2f6870');
    gradient.addColorStop(.28, '#78977a');
    gradient.addColorStop(.66, '#91a86f');
    gradient.addColorStop(1, '#536f54');
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

  drawCore(context: CanvasRenderingContext2D): boolean {
    if (!this.loaded) return false;
    const rect = LEVEL_ONE_MAP_ART.worldRect;
    const crop = centeredAspectCrop(this.core.naturalWidth, this.core.naturalHeight, rect.width, rect.height);
    context.drawImage(this.core, crop.x, crop.y, crop.width, crop.height, rect.x, rect.y, rect.width, rect.height);
    return true;
  }

  drawWaterMotion(
    context: CanvasRenderingContext2D,
    hexes: readonly HexState[],
    radius: number,
    phase: number,
  ): void {
    const water = hexes.filter((hex) => hex.terrain === Terrain.Decor && hex.decor === 'water');
    if (!water.length) return;
    context.save();
    context.beginPath();
    for (const hex of water) {
      for (let index = 0; index < 6; index += 1) {
        const angle = (60 * index - 90) * Math.PI / 180;
        const x = hex.x + radius * .955 * Math.cos(angle);
        const y = hex.y + radius * .955 * Math.sin(angle);
        if (index) context.lineTo(x, y); else context.moveTo(x, y);
      }
      context.closePath();
    }
    context.clip();
    const left = Math.min(...water.map((hex) => hex.x)) - radius;
    const right = Math.max(...water.map((hex) => hex.x)) + radius;
    const top = Math.min(...water.map((hex) => hex.y)) - radius;
    const bottom = Math.max(...water.map((hex) => hex.y)) + radius;
    context.strokeStyle = 'rgba(218,247,247,.22)';
    context.lineWidth = Math.max(1, radius * .026);
    context.lineCap = 'round';
    for (let index = 0; index < 7; index += 1) {
      const y = top + (bottom - top) * (index + .5) / 7;
      const drift = Math.sin(phase * .65 + index * 1.7) * radius * .1;
      context.beginPath();
      context.moveTo(left - radius, y + drift);
      context.bezierCurveTo(
        left + (right - left) * .3, y - radius * .08 + drift,
        left + (right - left) * .7, y + radius * .08 + drift,
        right + radius, y + drift,
      );
      context.stroke();
    }
    context.restore();
  }

  drawAtmosphere(
    context: CanvasRenderingContext2D,
    width: number,
    height: number,
    runtime: WorldGeometry,
    phase: number,
  ): void {
    const margin = Math.max(12, runtime.radius * .55);
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
    topFog.addColorStop(0, 'rgba(229,237,220,.72)'); topFog.addColorStop(1, 'rgba(229,237,220,0)');
    context.fillStyle = topFog; context.fillRect(0, 0, width, Math.max(0, safe.y));
    const bottomStart = safe.y + safe.height;
    const bottomFog = context.createLinearGradient(0, bottomStart, 0, height);
    bottomFog.addColorStop(0, 'rgba(229,237,220,0)'); bottomFog.addColorStop(1, 'rgba(229,237,220,.76)');
    context.fillStyle = bottomFog; context.fillRect(0, bottomStart, width, Math.max(0, height - bottomStart));
    const leftFog = context.createLinearGradient(0, 0, Math.max(1, safe.x), 0);
    leftFog.addColorStop(0, 'rgba(229,237,220,.55)'); leftFog.addColorStop(1, 'rgba(229,237,220,0)');
    context.fillStyle = leftFog; context.fillRect(0, 0, Math.max(0, safe.x), height);
    const rightStart = safe.x + safe.width;
    const rightFog = context.createLinearGradient(rightStart, 0, width, 0);
    rightFog.addColorStop(0, 'rgba(229,237,220,0)'); rightFog.addColorStop(1, 'rgba(229,237,220,.58)');
    context.fillStyle = rightFog; context.fillRect(rightStart, 0, Math.max(0, width - rightStart), height);
    context.globalAlpha = .34;
    const drift = Math.sin(phase * .12) * Math.min(width, height) * .018;
    const fog = [
      { x: -width * .02 + drift, y: height * .22, radius: Math.max(180, height * .46) },
      { x: width * 1.02 - drift, y: height * .3, radius: Math.max(180, height * .52) },
      { x: width * .24, y: height * 1.05 + drift, radius: Math.max(160, width * .25) },
      { x: width * .78, y: -height * .06 - drift, radius: Math.max(160, width * .23) },
    ];
    for (const cloud of fog) {
      const gradient = context.createRadialGradient(cloud.x, cloud.y, 0, cloud.x, cloud.y, cloud.radius);
      gradient.addColorStop(0, 'rgba(237,242,224,.82)');
      gradient.addColorStop(.55, 'rgba(221,232,213,.38)');
      gradient.addColorStop(1, 'rgba(221,232,213,0)');
      context.fillStyle = gradient;
      context.fillRect(cloud.x - cloud.radius, cloud.y - cloud.radius, cloud.radius * 2, cloud.radius * 2);
    }
    context.restore();
  }

  coreScreenRect(transform: WorldTransform): { x: number; y: number; width: number; height: number } {
    const rect = LEVEL_ONE_MAP_ART.worldRect;
    return {
      x: rect.x * transform.scale + transform.translateX,
      y: rect.y * transform.scale + transform.translateY,
      width: rect.width * transform.scale,
      height: rect.height * transform.scale,
    };
  }
}
