import { hash01 } from '../core/random';
import { Terrain, type DecorType, type HexState, type LandscapeStyle, type VisualVariant } from '../core/types';

type PathDrawer = (context: CanvasRenderingContext2D, x: number, y: number, radius: number) => void;

export interface WaterShoreEdge {
  hex: HexState;
  edge: number;
}

export function fitSpriteSize(width: number, aspect: number, maxHeight: number): { width: number; height: number } {
  const height = Math.min(width * aspect, maxHeight);
  return { width: height / aspect, height };
}

const decorPalette: Record<DecorType, { fill: string; edge: string }> = {
  meadow: { fill: '#cfe3b7', edge: '#9fbd8c' }, forest: { fill: '#b8d6a2', edge: '#8eaf7f' },
  water: { fill: '#91ccdc', edge: '#619eb4' }, mountain: { fill: '#d9d2bd', edge: '#aaa58f' },
  ruin: { fill: '#e7d9b7', edge: '#bca77c' }, marsh: { fill: '#b9d9c1', edge: '#86b39a' },
  snow: { fill: '#edf5f2', edge: '#bfd4d2' },
};

type CandidateSprite =
  | 'mountainRidge' | 'mountainOutcrop' | 'mountainScree' | 'mountainSnow'
  | 'ruinCorner' | 'ruinPaving' | 'ruinFoundation'
  | 'marshCattails' | 'marshSedge' | 'marshLilies' | 'marshReeds'
  | 'snowConifer' | 'snowBush' | 'snowRocks' | 'snowdrift';

const candidateFiles: Record<CandidateSprite, string> = {
  mountainRidge: 'mountains-highland-ridge', mountainOutcrop: 'mountains-rock-outcrop',
  mountainScree: 'mountains-scree-cluster', mountainSnow: 'mountains-snow-peaks',
  ruinCorner: 'ruins-collapsed-corner', ruinPaving: 'ruins-cracked-paving',
  ruinFoundation: 'ruins-broken-foundation', marshCattails: 'marsh-cattails',
  marshSedge: 'marsh-sedge', marshLilies: 'marsh-lily-leaves',
  marshReeds: 'marsh-reeds-stones', snowConifer: 'snow-snow-conifer',
  snowBush: 'snow-snow-bush', snowRocks: 'snow-snow-rocks', snowdrift: 'snow-snowdrift',
};

export class LandscapeRenderer {
  private readonly sprites: Record<'tree' | 'conifer' | 'bush' | 'water' | 'shore', HTMLImageElement>;
  private readonly candidates = new Map<CandidateSprite, HTMLImageElement>();
  private readonly patterns = new WeakMap<CanvasRenderingContext2D, Partial<Record<'water' | 'shore', CanvasPattern>>>();

  constructor(private readonly onAssetReady?: () => void, private readonly visualVariant: VisualVariant = 'production') {
    this.sprites = {
      tree: this.load(`${import.meta.env.BASE_URL}assets/level1-tree.webp`),
      conifer: this.load(`${import.meta.env.BASE_URL}assets/level1-conifer-v2.webp`),
      bush: this.load(`${import.meta.env.BASE_URL}assets/level1-bush.webp`),
      water: this.load(`${import.meta.env.BASE_URL}assets/level1-water.webp`),
      shore: this.load(`${import.meta.env.BASE_URL}assets/level1-shore.webp`),
    };
  }

  private load(source: string): HTMLImageElement {
    const image = new Image();
    let retries = 0;
    const request = () => {
      const separator = source.includes('?') ? '&' : '?';
      image.src = retries === 0 ? source : `${source}${separator}retry=${retries}`;
    };
    image.addEventListener('load', () => this.onAssetReady?.(), { once: true });
    image.addEventListener('error', () => {
      if (retries >= 2) return;
      retries += 1;
      window.setTimeout(request, retries * 300);
    });
    request();
    return image;
  }

  private candidate(name: CandidateSprite): HTMLImageElement | null {
    if (this.visualVariant === 'production') return null;
    const existing = this.candidates.get(name);
    if (existing) return existing;
    const image = this.load(`${import.meta.env.BASE_URL}assets/decor-p1/${candidateFiles[name]}.webp`);
    this.candidates.set(name, image);
    return image;
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

  drawHex(context: CanvasRenderingContext2D, hex: HexState, radius: number, style: LandscapeStyle, seed: number, path: PathDrawer): void {
    const type = this.visualDecorType(hex, seed);
    const palette = this.visualVariant !== 'production' && seed === 909 && type === 'forest' ? decorPalette.snow
      : this.visualVariant === 'decor-p2' && seed === 303 && type === 'ruin' ? { fill: '#d8c69d', edge: '#9e835b' }
        : decorPalette[type];
    const materialStyle = this.visualVariant !== 'production' ? 'meadow-v1' : style;
    path(context, hex.x, hex.y, radius * 0.955);
    context.fillStyle = palette.fill; context.fill();
    if (materialStyle === 'meadow-v1' && type === 'water') {
      const material = this.materialPattern(context, 'water');
      if (material) {
        context.save(); context.globalAlpha = .7; context.fillStyle = material; context.fill(); context.restore();
      }
    }
    context.save(); path(context, hex.x, hex.y, radius * 0.84); context.clip();
    this.details(context, hex, radius, hash01(hex.col, hex.row, seed), seed, type);
    context.restore();
    path(context, hex.x, hex.y, radius * 0.955); context.strokeStyle = palette.edge; context.lineWidth = 1.15; context.stroke();
  }

  private sprite(context: CanvasRenderingContext2D, image: HTMLImageElement, x: number, y: number, width: number, anchor = 0.58, maxHeight = Infinity): boolean {
    if (!image.complete || !image.naturalWidth) return false;
    const aspect = image.naturalHeight / image.naturalWidth;
    const fitted = fitSpriteSize(width, aspect, maxHeight);
    context.save(); context.globalAlpha = 0.94; context.filter = 'saturate(.82) contrast(.96)';
    context.drawImage(image, x - fitted.width / 2, y - fitted.height * anchor, fitted.width, fitted.height); context.restore();
    return true;
  }

  private candidateSprite(context: CanvasRenderingContext2D, image: HTMLImageElement | null, x: number, y: number, width: number, anchor: number, maxHeight: number): boolean {
    if (!image) return false;
    if (!image.complete || !image.naturalWidth) return true;
    this.sprite(context, image, x, y, width, anchor, maxHeight);
    return true;
  }

  private materialPattern(context: CanvasRenderingContext2D, type: 'water' | 'shore'): CanvasPattern | null {
    const existing = this.patterns.get(context)?.[type];
    if (existing) return existing;
    const image = this.sprites[type];
    if (!image.complete || !image.naturalWidth) return null;
    const pattern = context.createPattern(image, 'repeat');
    if (!pattern) return null;
    pattern.setTransform(new DOMMatrix().scale(.55));
    const cached = this.patterns.get(context) ?? {};
    cached[type] = pattern; this.patterns.set(context, cached);
    return pattern;
  }

  private tree(context: CanvasRenderingContext2D, x: number, y: number, size: number, cellRadius: number, conifer = false): void {
    const image = conifer ? this.sprites.conifer : this.sprites.tree;
    if (this.sprite(context, image, x, y, size, conifer ? 0.61 : 0.58, cellRadius * 1.25)) return;
    context.fillStyle = '#745f43'; context.fillRect(x - size * .05, y, size * .1, size * .32);
    context.fillStyle = conifer ? '#486f48' : '#547b4d';
    context.beginPath(); context.arc(x, y - size * .15, size * .28, 0, Math.PI * 2); context.fill();
  }

  private details(context: CanvasRenderingContext2D, hex: HexState, size: number, q: number, seed: number, type: DecorType): void {
    if (this.visualVariant !== 'production') {
      if (this.visualVariant === 'decor-p2' && seed === 303 && type === 'ruin') {
        const image = this.candidate(hex.row === 6 ? 'ruinCorner' : 'ruinPaving');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .2, size * 1.42, .55, size * .88)) return;
      } else if (this.visualVariant === 'decor-p2' && seed === 404 && type === 'mountain') {
        const image = this.candidate(hex.row === 4 ? 'mountainOutcrop' : hex.row === 8 ? 'mountainRidge' : 'mountainScree');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .16, size * 1.34, .58, size * 1.18)) return;
      } else if (type === 'mountain') {
        const image = this.candidate(seed === 909 && q > .4 ? 'mountainSnow'
          : q < .34 ? 'mountainRidge' : q < .68 ? 'mountainOutcrop' : 'mountainScree');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .16, size * 1.28, .58, size * 1.18)) return;
      } else if (type === 'ruin') {
        const image = this.candidate(q < .38 ? 'ruinPaving' : q < .72 ? 'ruinCorner' : 'ruinFoundation');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .17, size * 1.25, .55, size * .78)) return;
      } else if (type === 'marsh') {
        const image = this.candidate(q < .28 ? 'marshSedge' : q < .54 ? 'marshCattails' : q < .78 ? 'marshReeds' : 'marshLilies');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .16, size * .9, .56, size * 1.02)) return;
      } else if (type === 'snow') {
        const image = this.candidate(q < .38 ? 'snowBush' : q < .72 ? 'snowRocks' : 'snowdrift');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .14, size * .94, .55, size * .9)) return;
      } else if (type === 'forest' && seed === 909) {
        const image = this.candidate(q < .58 ? 'snowBush' : 'snowConifer');
        if (this.candidateSprite(context, image, hex.x, hex.y + size * .15, size * .86, .58, size * 1.12)) return;
      }
    }
    if (type === 'forest') {
      if (q < .22 && this.sprite(context, this.sprites.bush, hex.x - size * .15, hex.y + size * .16, size * .62, .5)) return;
      this.tree(context, hex.x + (q - .5) * size * .22, hex.y + size * .15, size * (.76 + q * .28), size, q > .68);
      if (q > .45) this.tree(context, hex.x - size * .25, hex.y + size * .25, size * .42, size, q > .82);
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

  drawWaterShores(context: CanvasRenderingContext2D, hexes: readonly HexState[], radius: number, style: LandscapeStyle, path: PathDrawer): void {
    if (style === 'meadow-v1' || this.visualVariant !== 'production') {
      const material = this.materialPattern(context, 'shore');
      context.save(); context.lineCap = 'round'; context.lineJoin = 'round';
      for (const { hex, edge } of exposedWaterShoreEdges(hexes)) {
        const startAngle = (60 * edge - 90) * Math.PI / 180;
        const endAngle = (60 * (edge + 1) - 90) * Math.PI / 180;
        const edgeRadius = radius * .955;
        const x1 = hex.x + edgeRadius * Math.cos(startAngle); const y1 = hex.y + edgeRadius * Math.sin(startAngle);
        const x2 = hex.x + edgeRadius * Math.cos(endAngle); const y2 = hex.y + edgeRadius * Math.sin(endAngle);
        const midpointX = (x1 + x2) / 2; const midpointY = (y1 + y2) / 2;
        const bend = radius * (.012 + hash01(hex.col * 7 + edge, hex.row, 101) * .022);
        const length = Math.hypot(hex.x - midpointX, hex.y - midpointY) || 1;
        const controlX = midpointX + (hex.x - midpointX) / length * bend;
        const controlY = midpointY + (hex.y - midpointY) / length * bend;
        const stroke = (style: string | CanvasPattern, width: number, alpha: number) => {
          context.beginPath(); context.moveTo(x1, y1); context.quadraticCurveTo(controlX, controlY, x2, y2);
          context.strokeStyle = style; context.lineWidth = width; context.globalAlpha = alpha; context.stroke();
        };
        stroke('#526b5c', Math.max(3.2, radius * .18), .22);
        stroke(material ?? '#c9b27f', Math.max(2.4, radius * .115), .96);
        stroke('#eee5c3', Math.max(.7, radius * .021), .72);
      }
      context.restore();
      return;
    }
    for (const hex of hexes.filter((candidate) => candidate.terrain === Terrain.Decor && candidate.decor === 'water')) {
      path(context, hex.x, hex.y, radius * .955); context.strokeStyle = 'rgba(233,209,154,.9)'; context.lineWidth = Math.max(1.8, radius * .11); context.stroke();
      path(context, hex.x, hex.y, radius * .91); context.strokeStyle = decorPalette.water.edge; context.lineWidth = 1.1; context.stroke();
    }
  }

  private visualDecorType(hex: HexState, seed: number): DecorType {
    const original = hex.decor ?? 'meadow';
    if (this.visualVariant !== 'decor-p2') return original;
    if (seed === 303 && original === 'ruin' && !this.isTerraceCell(hex)) return 'meadow';
    if (seed === 404 && original === 'mountain' && !this.isHighlandAccent(hex)) return 'meadow';
    return original;
  }

  private isTerraceCell(hex: HexState): boolean {
    return (hex.col === 0 || hex.col === 6) && hex.row >= 5 && hex.row <= 7;
  }

  private isHighlandAccent(hex: HexState): boolean {
    return (hex.col === 0 || hex.col === 6) && (hex.row === 4 || hex.row === 8 || hex.row === 9);
  }

}

const neighborForEdge = (hex: HexState, edge: number): string => {
  const parity = hex.row & 1;
  const offsets = [
    [parity, -1], [1, 0], [parity, 1], [parity - 1, 1], [-1, 0], [parity - 1, -1],
  ] as const;
  const [col, row] = offsets[edge];
  return `${hex.col + col},${hex.row + row}`;
};

export function exposedWaterShoreEdges(hexes: readonly HexState[]): WaterShoreEdge[] {
  const water = hexes.filter((hex) => hex.terrain === Terrain.Decor && hex.decor === 'water');
  const waterKeys = new Set(water.map((hex) => `${hex.col},${hex.row}`));
  return water.flatMap((hex) => Array.from({ length: 6 }, (_, edge) => ({ hex, edge })))
    .filter(({ hex, edge }) => !waterKeys.has(neighborForEdge(hex, edge)));
}
