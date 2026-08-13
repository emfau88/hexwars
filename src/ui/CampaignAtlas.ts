import type { CampaignProgress } from '../core/types';
import type { I18n } from '../i18n/I18n';
import { LEVELS } from '../levels';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const SQRT3 = Math.sqrt(3);

type AtlasCell = { q: number; r: number; x: number; y: number };
type AtlasLayout = {
  width: number;
  height: number;
  size: number;
  cells: AtlasCell[];
  stations: ReadonlyMap<string, number>;
  water: ReadonlySet<string>;
  vegetation: ReadonlyMap<string, 'tree' | 'conifer' | 'bush'>;
};

const key = ({ q, r }: Pick<AtlasCell, 'q' | 'r'>): string => `${q},${r}`;

const svgNode = <K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const element = document.createElementNS(SVG_NS, name);
  for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, String(value));
  return element;
};

function cells(columns: number, rows: number, size: number, left: number, top: number): AtlasCell[] {
  const result: AtlasCell[] = [];
  for (let q = 0; q < columns; q += 1) for (let r = 0; r < rows; r += 1) {
    result.push({ q, r, x: left + q * size * 1.5, y: top + r * size * SQRT3 + (q % 2) * size * SQRT3 / 2 });
  }
  return result;
}

function points(cell: AtlasCell, size: number, scale = 1): string {
  return Array.from({ length: 6 }, (_, index) => {
    const angle = index * Math.PI / 3;
    return `${cell.x + Math.cos(angle) * size * scale},${cell.y + Math.sin(angle) * size * scale}`;
  }).join(' ');
}

function layoutForMobile(mobile: boolean): AtlasLayout {
  if (mobile) return {
    width: 390, height: 250, size: 31, cells: cells(7, 4, 31, 50, 27),
    stations: new Map([['0,0',0],['2,0',1],['4,0',2],['1,1',3],['3,1',4],['5,1',5],['0,3',6],['2,3',7],['4,3',8],['6,3',9]]),
    water: new Set(['5,2','6,0','6,1','6,2','0,2','1,2']),
    vegetation: new Map([['1,0','tree'],['3,0','conifer'],['5,0','bush'],['2,2','bush'],['4,2','tree'],['1,3','conifer'],['3,3','tree'],['5,3','conifer']]),
  };
  return {
    width: 760, height: 650, size: 39, cells: cells(11, 8, 39, 64, 56),
    stations: new Map([['1,1',0],['4,1',1],['7,1',2],['2,3',3],['5,3',4],['8,3',5],['1,5',6],['4,5',7],['7,5',8],['9,6',9]]),
    water: new Set(['8,0','9,0','9,1','10,0','10,1','10,2','0,4','0,5','1,5','1,6','2,6']),
    vegetation: new Map([['0,0','tree'],['2,0','conifer'],['6,0','bush'],['10,4','tree'],['9,4','conifer'],['3,2','bush'],['0,7','conifer'],['2,7','tree'],['5,7','conifer'],['6,6','bush'],['8,7','tree'],['10,7','conifer']]),
  };
}

function neighbouringCell(layout: AtlasLayout, cell: AtlasCell, edge: number): AtlasCell | undefined {
  const direction = Math.PI / 6 + edge * Math.PI / 3;
  const targetX = cell.x + Math.cos(direction) * layout.size * SQRT3;
  const targetY = cell.y + Math.sin(direction) * layout.size * SQRT3;
  return layout.cells.find((candidate) => Math.hypot(candidate.x - targetX, candidate.y - targetY) < 2);
}

function shorePath(layout: AtlasLayout, cell: AtlasCell, edge: number): string {
  const firstAngle = edge * Math.PI / 3;
  const secondAngle = (edge + 1) * Math.PI / 3;
  const x1 = cell.x + Math.cos(firstAngle) * layout.size; const y1 = cell.y + Math.sin(firstAngle) * layout.size;
  const x2 = cell.x + Math.cos(secondAngle) * layout.size; const y2 = cell.y + Math.sin(secondAngle) * layout.size;
  const midpointX = (x1 + x2) / 2; const midpointY = (y1 + y2) / 2;
  const dx = cell.x - midpointX; const dy = cell.y - midpointY; const length = Math.hypot(dx, dy) || 1;
  const variation = Math.abs(Math.sin((cell.q + 1) * 17.17 + (cell.r + 1) * 31.73 + edge * 13.37));
  const bend = .4 + variation * .9;
  return `M ${x1} ${y1} Q ${midpointX + dx / length * bend} ${midpointY + dy / length * bend} ${x2} ${y2}`;
}

export class CampaignAtlas {
  private mobile: boolean | null = null;

  constructor(private readonly svg: SVGSVGElement, private readonly i18n: I18n) {}

  needsLayoutUpdate(): boolean {
    return this.mobile !== matchMedia('(max-width:900px), (max-height:620px)').matches;
  }

  render(progress: CampaignProgress, unlocked: (index: number) => boolean, selected: number, onSelect: (index: number) => void): void {
    this.mobile = matchMedia('(max-width:900px), (max-height:620px)').matches;
    const layout = layoutForMobile(this.mobile);
    this.svg.replaceChildren();
    this.svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);

    const defs = svgNode('defs');
    const waterPattern = svgNode('pattern', { id:'campaign-water-material', patternUnits:'userSpaceOnUse', width:768, height:768 });
    waterPattern.append(svgNode('rect', { width:768, height:768, fill:'#6ea8ba' }));
    waterPattern.append(svgNode('image', { href:`${import.meta.env.BASE_URL}assets/level1-water.webp`, width:768, height:768, opacity:.72 }));
    const shorePattern = svgNode('pattern', { id:'campaign-shore-material', patternUnits:'userSpaceOnUse', width:768, height:768 });
    shorePattern.append(svgNode('rect', { width:768, height:768, fill:'#c9b27f' }));
    shorePattern.append(svgNode('image', { href:`${import.meta.env.BASE_URL}assets/level1-shore.webp`, width:768, height:768, opacity:.76 }));
    defs.append(waterPattern, shorePattern); this.svg.append(defs);

    const terrain = svgNode('g', { 'aria-hidden':'true' });
    layout.cells.forEach((cell, index) => {
      const cellKey = key(cell); const station = layout.stations.get(cellKey); const water = layout.water.has(cellKey);
      const band = this.mobile ? (cell.r < 2 ? 0 : cell.r < 3 ? 1 : 2) : (cell.r < 3 ? 0 : cell.r < 5 ? 1 : 2);
      const fills = ['#c7d7ae','#becd9d','#b3c592'];
      terrain.append(svgNode('polygon', {
        points:points(cell, layout.size), fill:station === undefined ? (water ? 'url(#campaign-water-material)' : fills[band]) : '#eee8d1',
        class:`atlasHex${water ? ' water' : ''}${station !== undefined ? ' station' : ''}`,
      }));
      const vegetation = layout.vegetation.get(cellKey);
      if (vegetation && station === undefined && !water) this.addVegetation(defs, terrain, layout, cell, vegetation, index);
    });
    this.svg.append(terrain);

    const shores = svgNode('g', { 'aria-hidden':'true' });
    for (const cell of layout.cells.filter((candidate) => layout.water.has(key(candidate)))) for (let edge = 0; edge < 6; edge += 1) {
      const neighbour = neighbouringCell(layout, cell, edge);
      if (!neighbour || !layout.water.has(key(neighbour))) {
        const d = shorePath(layout, cell, edge);
        shores.append(svgNode('path', { d, class:'atlasShoreShadow' }));
        shores.append(svgNode('path', { d, class:'atlasShoreMaterial', stroke:'url(#campaign-shore-material)' }));
        shores.append(svgNode('path', { d, class:'atlasShoreLight' }));
      }
    }
    this.svg.append(shores);

    const nodes = svgNode('g', { id:'mapNodes', 'aria-label':this.i18n.t('campaign.atlasGroupAria') });
    for (const [cellKey, levelIndex] of layout.stations) {
      const cell = layout.cells.find((candidate) => key(candidate) === cellKey);
      if (!cell) continue;
      const foreign = svgNode('foreignObject', {
        x:cell.x - layout.size * .94, y:cell.y - layout.size * .94, width:layout.size * 1.88, height:layout.size * 1.88,
      });
      const button = document.createElementNS(HTML_NS, 'button') as HTMLButtonElement;
      const available = unlocked(levelIndex); const complete = progress.completed[levelIndex];
      button.type = 'button'; button.dataset.level = String(levelIndex); button.dataset.act = String(levelIndex < 3 ? 0 : levelIndex < 6 ? 1 : 2);
      button.className = `mapNode ${available ? 'unlocked' : 'locked'}${complete ? ' completed' : ''}${selected === levelIndex ? ' current' : ''}`;
      button.setAttribute('aria-label', this.i18n.t('campaign.levelAria', {
        level: levelIndex + 1,
        name: this.i18n.text(LEVELS[levelIndex].short),
        locked: available ? '' : this.i18n.t('campaign.levelLockedSuffix'),
      }));
      button.innerHTML = `<span class="atlasLevelNumber">${String(levelIndex + 1).padStart(2, '0')}</span><span class="atlasLevelState" aria-hidden="true">${complete ? '✓' : available ? '•' : '·'}</span>`;
      button.addEventListener('click', () => onSelect(levelIndex));
      foreign.append(button); nodes.append(foreign);
    }
    this.svg.append(nodes);
  }

  private addVegetation(defs: SVGDefsElement, group: SVGGElement, layout: AtlasLayout, cell: AtlasCell, type: 'tree' | 'conifer' | 'bush', index: number): void {
    const clipId = `campaign-cell-${index}`;
    const clip = svgNode('clipPath', { id:clipId }); clip.append(svgNode('polygon', { points:points(cell, layout.size, .86) })); defs.append(clip);
    const href = type === 'tree' ? 'level1-tree.webp' : type === 'conifer' ? 'level1-conifer-v2.webp' : 'level1-bush.webp';
    const width = type === 'bush' ? layout.size * .82 : type === 'conifer' ? layout.size * .72 : layout.size * 1.25;
    const height = type === 'conifer' ? width * 1.52 : width;
    group.append(svgNode('image', {
      href:`${import.meta.env.BASE_URL}assets/${href}`, x:cell.x - width / 2, y:cell.y - height * .57,
      width, height, 'clip-path':`url(#${clipId})`, preserveAspectRatio:'xMidYMid meet', opacity:.94,
    }));
  }
}
