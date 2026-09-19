import { Owner } from '../core/types';

const ASSET_BASE = import.meta.env?.BASE_URL ?? './';

interface StructureSprites {
  orangeHq: HTMLImageElement;
  blueHq: HTMLImageElement;
  guardian: HTMLImageElement;
}

export class StructureAssetRenderer {
  private readonly sprites: StructureSprites;

  constructor() {
    this.sprites = {
      orangeHq: this.load(`${ASSET_BASE}assets/structures/hq-orange-v1.png`),
      blueHq: this.load(`${ASSET_BASE}assets/structures/hq-blue-v1.png`),
      guardian: this.load(`${ASSET_BASE}assets/structures/guardian-neutral-v1.png`),
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
    if (!this.ready(this.sprites.guardian)) return false;
    this.drawCentered(context, this.sprites.guardian, x, y - radius * .05, radius * 2.02);
    return true;
  }

  private load(source: string): HTMLImageElement {
    const image = new Image();
    image.decoding = 'async';
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
