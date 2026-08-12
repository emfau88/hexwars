import { hash01 } from '../core/random';
import { Terrain, type DecorType, type HexState } from '../core/types';

type PathDrawer = (context: CanvasRenderingContext2D, x: number, y: number, radius: number) => void;

const decorPalette: Record<DecorType, { fill: string; edge: string }> = {
  meadow: { fill: '#cfe3b7', edge: '#9fbd8c' }, forest: { fill: '#b8d6a2', edge: '#8eaf7f' },
  water: { fill: '#91ccdc', edge: '#619eb4' }, mountain: { fill: '#d9d2bd', edge: '#aaa58f' },
  ruin: { fill: '#e7d9b7', edge: '#bca77c' }, marsh: { fill: '#b9d9c1', edge: '#86b39a' },
  snow: { fill: '#edf5f2', edge: '#bfd4d2' },
};

export class LandscapeRenderer {
  private readonly sprites = {
    tree: this.load(`${import.meta.env.BASE_URL}assets/level1-tree.webp`),
    conifer: this.load(`${import.meta.env.BASE_URL}assets/level1-conifer.webp`),
    bush: this.load(`${import.meta.env.BASE_URL}assets/level1-bush.webp`),
  };

  private load(source: string): HTMLImageElement {
    const image = new Image(); image.src = source; return image;
  }

  backdrop(context: CanvasRenderingContext2D, width: number, height: number, levelIndex: number): void {
    context.fillStyle = levelIndex === 0 ? '#d7e3b3' : '#dce8d0';
    context.fillRect(0, 0, width, height);
    context.save(); context.globalAlpha = levelIndex === 0 ? 0.07 : 0.12; context.strokeStyle = '#8fa78f';
    for (let index = 0; index < 18; index += 1) {
      const y = (index + 1) * height / 19;
      context.beginPath(); context.moveTo(0, y); context.quadraticCurveTo(width * 0.5, y + Math.sin(index) * 7, width, y); context.stroke();
    }
    context.restore();
  }

  drawHex(context: CanvasRenderingContext2D, hex: HexState, radius: number, seed: number, path: PathDrawer): void {
    const type = hex.decor ?? 'meadow';
    const palette = decorPalette[type];
    path(context, hex.x, hex.y, radius * 0.955);
    context.fillStyle = palette.fill; context.fill();
    context.save(); path(context, hex.x, hex.y, radius * 0.84); context.clip();
    this.details(context, hex, radius, hash01(hex.col, hex.row, seed));
    context.restore();
    path(context, hex.x, hex.y, radius * 0.955); context.strokeStyle = palette.edge; context.lineWidth = 1.15; context.stroke();
  }

  private sprite(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, anchor = 0.58): boolean {
    if (!image.complete || !image.naturalWidth) return false;
    const height = width * image.naturalHeight / image.naturalWidth;
    context.save(); context.globalAlpha = 0.94; context.filter = 'saturate(.82) contrast(.96)';
    context.drawImage(image, x - width / 2, y - height * anchor, width, height); context.restore();
    return true;
  }

  private tree(context: CanvasRenderingContext2D, x: number, y: number, size: number, conifer = false): void {
    const image = conifer ? this.sprites.conifer : this.sprites.tree;
    if (this.sprite(context, image, x, y, size, conifer ? 0.61 : 0.58)) return;
    context.fillStyle = '#745f43'; context.fillRect(x - size * .05, y, size * .1, size * .32);
    context.fillStyle = conifer ? '#486f48' : '#547b4d';
    context.beginPath(); context.arc(x, y - size * .15, size * .28, 0, Math.PI * 2); context.fill();
  }

  private details(context: CanvasRenderingContext2D, hex: HexState, size: number, q: number): void {
    const type = hex.decor ?? 'meadow';
    if (type === 'forest') {
      if (q < .22 && this.sprite(context, this.sprites.bush, hex.x - size * .15, hex.y + size * .16, size * .62, .5)) return;
      this.tree(context, hex.x + (q - .5) * size * .22, hex.y + size * .15, size * (.76 + q * .28), q > .68);
      if (q > .45) this.tree(context, hex.x - size * .25, hex.y + size * .25, size * .42, q > .82);
    } else if (type === 'water') {
      context.strokeStyle = 'rgba(236,249,244,.62)'; context.lineWidth = Math.max(1, size * .04); context.lineCap = 'round';
      for (const offset of [-.2, .18]) { context.beginPath(); context.moveTo(hex.x - size * .32, hex.y + size * offset); context.quadraticCurveTo(hex.x, hex.y + size * (offset - .06), hex.x + size * .32, hex.y + size * offset); context.stroke(); }
    } else if (type === 'mountain') {
      context.fillStyle = '#92988f'; context.beginPath(); context.moveTo(hex.x - size * .46, hex.y + size * .28); context.lineTo(hex.x - size * .12, hex.y - size * .4); context.lineTo(hex.x + size * .18, hex.y + size * .28); context.fill();
      context.fillStyle = '#f0efdf'; context.beginPath(); context.moveTo(hex.x - size * .22, hex.y - size * .2); context.lineTo(hex.x - size * .12, hex.y - size * .4); context.lineTo(hex.x, hex.y - size * .14); context.fill();
    } else if (type === 'ruin') {
      context.strokeStyle = '#9e8968'; context.lineWidth = Math.max(1.5, size * .06); context.strokeRect(hex.x - size * .28, hex.y - size * .2, size * .5, size * .44);
    } else if (type === 'marsh') {
      context.fillStyle = 'rgba(91,152,137,.35)'; context.beginPath(); context.ellipse(hex.x, hex.y + size * .15, size * .4, size * .22, 0, 0, Math.PI * 2); context.fill();
      context.strokeStyle = '#6c966d'; for (let index = -2; index <= 2; index += 1) { context.beginPath(); context.moveTo(hex.x + index * size * .13, hex.y + size * .28); context.lineTo(hex.x + index * size * .13 + 2, hex.y - size * .12); context.stroke(); }
    } else {
      context.strokeStyle = '#729665'; context.globalAlpha = .56; context.lineWidth = 1.2;
      if (q > .3) for (let index = -1; index <= 1; index += 1) { context.beginPath(); context.moveTo(hex.x + index * size * .1, hex.y + size * .18); context.lineTo(hex.x + index * size * .1 + 2, hex.y - size * .04); context.stroke(); }
      context.globalAlpha = 1;
    }
  }

  drawWaterShores(context: CanvasRenderingContext2D, hexes: readonly HexState[], radius: number, path: PathDrawer): void {
    for (const hex of hexes.filter((candidate) => candidate.terrain === Terrain.Decor && candidate.decor === 'water')) {
      path(context, hex.x, hex.y, radius * .955); context.strokeStyle = 'rgba(233,209,154,.9)'; context.lineWidth = Math.max(1.8, radius * .11); context.stroke();
      path(context, hex.x, hex.y, radius * .91); context.strokeStyle = decorPalette.water.edge; context.lineWidth = 1.1; context.stroke();
    }
  }
}
