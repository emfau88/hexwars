import { WORLD_COLS, WORLD_ROWS } from '../core/config';
import type { GameState } from '../core/GameState';
import { isPlayable } from '../core/hex';
import { Owner, Terrain, type HexState, type Point, type SendMode, type VisualVariant } from '../core/types';
import { terrainCapacity } from '../systems/GrowthSystem';
import { EffectsRenderer } from './EffectsRenderer';
import { LandscapeRenderer } from './LandscapeRenderer';
import { mix, OWNER_COLORS } from './palette';

export class BoardRenderer {
  width = 1; height = 1; radius = 24;
  selected: HexState | null = null;
  dragPosition: Point | null = null;
  sendMode: SendMode = 'half';
  readonly effects = new EffectsRenderer();
  private horizontal = 0; private vertical = 0; private originX = 0; private originY = 0;
  private readonly context: CanvasRenderingContext2D;
  private readonly landscape: LandscapeRenderer;

  constructor(readonly canvas: HTMLCanvasElement, readonly stage: HTMLElement, visualVariant: VisualVariant = 'production') {
    const context = canvas.getContext('2d', { alpha: false });
    if (!context) throw new Error('Canvas 2D is unavailable.');
    this.context = context;
    this.landscape = new LandscapeRenderer(undefined, visualVariant);
  }

  resize(state?: GameState): void {
    this.width = Math.max(1, this.stage.clientWidth); this.height = Math.max(1, this.stage.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * ratio); this.canvas.height = Math.round(this.height * ratio);
    this.canvas.style.width = `${this.width}px`; this.canvas.style.height = `${this.height}px`;
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const padding = this.width < 900 ? 8 : 18;
    const byWidth = (this.width - padding * 2) / ((WORLD_COLS + .5) * Math.sqrt(3));
    const byHeight = (this.height - padding * 2) / (WORLD_ROWS * 1.5 + .5);
    this.radius = Math.max(18, Math.min(this.width < 520 ? 31 : 34, byWidth, byHeight));
    this.horizontal = Math.sqrt(3) * this.radius; this.vertical = 1.5 * this.radius;
    const gridWidth = (WORLD_COLS + .5) * this.horizontal;
    const gridHeight = WORLD_ROWS * 1.5 * this.radius + .5 * this.radius;
    this.originX = (this.width - gridWidth) / 2 + this.horizontal / 2;
    this.originY = (this.height - gridHeight) / 2 + this.radius;
    state?.setPositions((col, row) => this.positionFor(col, row));
  }

  positionFor(col: number, row: number): Point {
    return { x: this.originX + col * this.horizontal + (row % 2 ? this.horizontal / 2 : 0), y: this.originY + row * this.vertical };
  }

  static path(context: CanvasRenderingContext2D, x: number, y: number, radius: number): void {
    context.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = (60 * index - 90) * Math.PI / 180;
      const point = { x: x + radius * Math.cos(angle), y: y + radius * Math.sin(angle) };
      if (index) context.lineTo(point.x, point.y); else context.moveTo(point.x, point.y);
    }
    context.closePath();
  }

  findHex(state: GameState, point: Point): HexState | null {
    let best: HexState | null = null; let distance = Infinity;
    for (const hex of state.hexes) {
      const candidate = (point.x - hex.x) ** 2 + (point.y - hex.y) ** 2;
      if (candidate < distance) { distance = candidate; best = hex; }
    }
    if (!best) return null;
    const dx = Math.abs(point.x - best.x); const dy = Math.abs(point.y - best.y);
    const radius = this.radius * 1.12; const halfWidth = Math.sqrt(3) / 2 * radius;
    return dx <= halfWidth && dy <= radius && dy <= radius - (radius * .5 / halfWidth) * dx + 1.5 ? best : null;
  }

  draw(state: GameState): void {
    this.landscape.backdrop(this.context, this.width, this.height, state.currentLevel);
    const reachable = this.selected ? new Set(state.hexes.filter((hex) => state.canSend(this.selected, hex))) : null;
    for (const hex of state.hexes) this.drawHex(state, hex, reachable);
    this.landscape.drawWaterShores(this.context, state.hexes, this.radius, state.level.landscapeStyle, BoardRenderer.path);
    for (const army of state.armies) {
      this.context.save(); this.context.globalAlpha = army.kind === 'supply' ? .24 : .18; this.context.strokeStyle = army.kind === 'supply' ? '#e8c07d' : OWNER_COLORS[army.owner].edge;
      this.context.lineWidth = army.kind === 'supply' ? 2 : 1.5; this.context.beginPath(); this.context.moveTo(army.x0, army.y0); this.context.lineTo(army.cx, army.cy); this.context.stroke(); this.context.restore();
      this.drawArmy(army.owner, army.units, army.cx, army.cy, army.kind === 'supply');
    }
    this.effects.draw(this.context);
    this.drawDrag(state);
  }

  private drawHex(state: GameState, hex: HexState, reachable: Set<HexState> | null): void {
    if (hex.terrain === Terrain.Decor) { this.landscape.drawHex(this.context, hex, this.radius, state.level.landscapeStyle, state.level.seed, BoardRenderer.path); return; }
    if (!isPlayable(hex)) return;
    const colors = OWNER_COLORS[hex.owner];
    const load = hex.owner === Owner.Neutral ? .36 : Math.max(0, Math.min(1, hex.units / terrainCapacity(hex)));
    BoardRenderer.path(this.context, hex.x, hex.y, this.radius * .92);
    this.context.fillStyle = mix(colors.low, colors.high, load); this.context.fill();
    if (reachable && hex !== this.selected && !reachable.has(hex)) { this.context.fillStyle = 'rgba(80,91,82,.18)'; this.context.fill(); }
    this.context.strokeStyle = colors.edge; this.context.lineWidth = hex.terrain === Terrain.Base ? 3 : 1.8; this.context.stroke();
    if (hex.flash > 0) { BoardRenderer.path(this.context, hex.x, hex.y, this.radius * (.92 + hex.flash * .08)); this.context.strokeStyle = '#fff2c8'; this.context.globalAlpha = Math.min(1, hex.flash * 2); this.context.lineWidth = 3; this.context.stroke(); this.context.globalAlpha = 1; }
    if (hex.siege) {
      const pulse = .72 + Math.sin(performance.now() / 110) * .08;
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * pulse); this.context.strokeStyle = '#f3c966'; this.context.lineWidth = 3.5; this.context.stroke();
      this.context.fillStyle = 'rgba(213,106,97,.12)'; this.context.fill();
    }
    if (this.selected === hex) { BoardRenderer.path(this.context, hex.x, hex.y, this.radius * .99); this.context.strokeStyle = '#e5a33d'; this.context.lineWidth = 3; this.context.stroke(); }
    if (state.focusedFront(hex.owner) === hex) {
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * 1.04); this.context.strokeStyle = '#f0c86c'; this.context.lineWidth = 2.5; this.context.setLineDash([3, 3]); this.context.stroke(); this.context.setLineDash([]);
    }
    this.terrainGlyph(hex);
    this.context.fillStyle = colors.text; this.context.font = `700 ${Math.max(11, Math.floor(this.radius * .52))}px system-ui,sans-serif`;
    this.context.textAlign = 'center'; this.context.textBaseline = 'middle'; this.context.fillText(String(Math.floor(hex.units)), hex.x, hex.y - this.radius * .04);
  }

  private terrainGlyph(hex: HexState): void {
    const size = this.radius * .28; this.context.save(); this.context.translate(hex.x, hex.y + this.radius * .35);
    this.context.strokeStyle = 'rgba(176,128,55,.9)'; this.context.lineWidth = Math.max(1, this.radius * .045);
    if (hex.terrain === Terrain.Base) { this.context.rotate(Math.PI / 4); this.context.strokeRect(-size * .47, -size * .47, size * .94, size * .94); }
    else if (hex.terrain === Terrain.Relay) { this.context.beginPath(); this.context.arc(0, 0, size * .45, 0, Math.PI * 2); this.context.stroke(); }
    else if (hex.terrain === Terrain.Hill) { this.context.beginPath(); this.context.moveTo(-size * .78, size * .3); this.context.lineTo(0, -size * .52); this.context.lineTo(size * .78, size * .3); this.context.stroke(); }
    this.context.restore();
  }

  private drawArmy(owner: Owner, units: number, x: number, y: number, supply: boolean): void {
    const colors = OWNER_COLORS[owner]; const radius = Math.max(5, Math.min(this.radius * .38, 5 + units * .16));
    this.context.beginPath(); this.context.arc(x, y, radius, 0, Math.PI * 2); this.context.fillStyle = colors.high; this.context.fill();
    this.context.strokeStyle = supply ? '#e8c07d' : colors.edge; this.context.lineWidth = supply ? 2 : 1.4; this.context.stroke();
    this.context.fillStyle = colors.text; this.context.font = `700 ${Math.max(8, Math.floor(radius * .9))}px ui-monospace`; this.context.textAlign = 'center'; this.context.textBaseline = 'middle'; this.context.fillText(String(Math.floor(units)), x, y);
  }

  private drawDrag(state: GameState): void {
    if (!this.selected || !this.dragPosition) return;
    const target = this.findHex(state, this.dragPosition); const valid = Boolean(target && state.canSend(this.selected, target));
    this.context.strokeStyle = valid ? '#4a9d63' : target && target !== this.selected ? '#d56a61' : '#e8c07d'; this.context.lineWidth = 2.5; this.context.setLineDash([6, 5]);
    this.context.beginPath(); this.context.moveTo(this.selected.x, this.selected.y); this.context.lineTo(this.dragPosition.x, this.dragPosition.y); this.context.stroke(); this.context.setLineDash([]);
    if (target && target !== this.selected) {
      BoardRenderer.path(this.context, target.x, target.y, this.radius * 1.02); this.context.strokeStyle = valid ? '#4a9d63' : '#d56a61'; this.context.lineWidth = 3.5; this.context.stroke();
    }
    const sent = this.sendMode === 'group' && target ? state.groupPotential(target, Owner.Player, this.selected) : Math.floor(this.selected.units * (this.sendMode === 'all' ? 1 : .5));
    const label = `${Math.floor(this.selected.units)}  →  ${sent} SENDEN`;
    this.context.font = `700 ${Math.max(10, Math.floor(this.radius * .28))}px ui-monospace`; this.context.textAlign = 'center';
    const width = this.context.measureText(label).width + 16; const x = this.selected.x; const y = this.selected.y - this.radius * .72;
    this.context.fillStyle = 'rgba(25,36,31,.94)'; this.context.fillRect(x - width / 2, y - 11, width, 20);
    this.context.fillStyle = '#f4f0dd'; this.context.fillText(label, x, y);
  }
}
