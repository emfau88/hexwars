import { Owner } from '../core/types';

const ASSET_BASE = import.meta.env?.BASE_URL ?? './';

interface StructureSprites {
  orangeHq: HTMLImageElement;
  blueHq: HTMLImageElement;
  guardian: HTMLImageElement | null;
  relay: HTMLImageElement | null;
  shieldIdle: HTMLImageElement | null;
  shieldImpact: HTMLImageElement | null;
  shieldDepleted: HTMLImageElement | null;
}

export class StructureAssetRenderer {
  private readonly sprites: StructureSprites;

  constructor(private readonly onAssetReady?: () => void) {
    this.sprites = {
      orangeHq: this.load(`${ASSET_BASE}assets/structures/hq-orange-v1.png`),
      blueHq: this.load(`${ASSET_BASE}assets/structures/hq-blue-v1.png`),
      guardian: null,
      relay: null,
      shieldIdle: null,
      shieldImpact: null,
      shieldDepleted: null,
    };
  }

  drawHq(
    context: CanvasRenderingContext2D,
    owner: Owner,
    x: number,
    y: number,
    radius: number,
  ): boolean {
    const sprite = owner === Owner.Player
      ? this.sprites.orangeHq
      : owner === Owner.Enemy
        ? this.sprites.blueHq
        : null;
    if (!sprite || !this.ready(sprite)) return false;
    this.drawCentered(context, sprite, x, y - radius * .03, radius * 2.46);
    return true;
  }

  drawGuardian(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ): boolean {
    this.sprites.guardian ??= this.load(`${ASSET_BASE}assets/structures/guardian-neutral-v1.png`);
    if (!this.ready(this.sprites.guardian)) return false;
    this.drawCentered(context, this.sprites.guardian, x, y - radius * .05, radius * 2.02);
    return true;
  }

  drawRelay(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
  ): boolean {
    this.sprites.relay ??= this.load(`${ASSET_BASE}assets/structures/relay-neutral-v2.png`);
    if (!this.ready(this.sprites.relay)) return false;
    this.drawCentered(context, this.sprites.relay, x, y - radius * .06, radius * 1.82);
    return true;
  }

  drawHqShield(
    context: CanvasRenderingContext2D,
    x: number,
    y: number,
    radius: number,
    ratio: number,
    impact: boolean,
  ): boolean {
    this.sprites.shieldIdle ??= this.load(`${ASSET_BASE}assets/structures/guardian-shield-idle-v1.png`);
    this.sprites.shieldImpact ??= this.load(`${ASSET_BASE}assets/structures/guardian-shield-impact-v1.png`);
    this.sprites.shieldDepleted ??= this.load(`${ASSET_BASE}assets/structures/guardian-shield-depleted-v1.png`);
    const sprite = impact
      ? this.sprites.shieldImpact
      : ratio <= .28
        ? this.sprites.shieldDepleted
        : this.sprites.shieldIdle;
    if (!this.ready(sprite)) return false;
    const size = radius * 3.25;
    context.drawImage(sprite, x - size / 2, y - size * .62, size, size);
    return true;
  }

  private load(source: string): HTMLImageElement {
    const image = new Image();
    image.decoding = 'async';
    image.addEventListener('load', () => this.onAssetReady?.(), { once:true });
    image.src = source;
    return image;
  }

  private ready(image: HTMLImageElement): boolean {
    return image.complete && image.naturalWidth > 0;
  }

  private drawCentered(
    context: CanvasRenderingContext2D,
    image: HTMLImageElement,
    x: number,
    y: number,
    size: number,
  ): void {
    context.drawImage(image, x - size / 2, y - size / 2, size, size);
  }
}
