import type { GameState } from '../core/GameState';
import { isPlayable } from '../core/hex';
import { Owner, Terrain, type HexState, type Point, type SendMode, type StructureState, type VisualVariant } from '../core/types';
import { terrainCapacity } from '../systems/GrowthSystem';
import { hqShield } from '../systems/StructureSystem';
import { EffectsRenderer } from './EffectsRenderer';
import { LandscapeRenderer } from './LandscapeRenderer';
import { MAP_ART_RENDER_LAYERS, MapArtRenderer, type MapStyleMode, type PreparedMapStyle } from './MapArtRenderer';
import { mix, OWNER_COLORS } from './palette';
import { StructureAssetRenderer } from './StructureAssetRenderer';
import {
  calculateWorldGeometry,
  inverseTransformPoint,
  positionFor,
  REFERENCE_WORLD_GEOMETRY,
  transformBetween,
  transformPoint,
  type WorldGeometry,
  type WorldTransform,
} from './WorldGeometry';

export class BoardRenderer {
  width = 1; height = 1;
  readonly radius = REFERENCE_WORLD_GEOMETRY.radius;
  selected: HexState | null = null;
  dragPosition: Point | null = null;
  sendMode: SendMode = 'all';
  sendLabel = 'SEND';
  shieldLabel = 'SHIELD';
  readonly effects = new EffectsRenderer();
  private runtimeGeometry: WorldGeometry = calculateWorldGeometry(1, 1);
  private worldTransform: WorldTransform = transformBetween(REFERENCE_WORLD_GEOMETRY, this.runtimeGeometry);
  private pixelRatio = 1;
  private readonly context: CanvasRenderingContext2D;
  private readonly mapCanvas: HTMLCanvasElement;
  private readonly mapContext: CanvasRenderingContext2D;
  private readonly environmentCanvas: HTMLCanvasElement;
  private readonly environmentContext: CanvasRenderingContext2D;
  private readonly landscape: LandscapeRenderer;
  private readonly mapArt: MapArtRenderer;
  private readonly structureAssets = new StructureAssetRenderer();
  private readonly reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  private mapLayerDirty = true;
  private environmentLayerDirty = true;
  private lastEnvironmentFrame = -Infinity;
  private lastMapArtLevel = -1;

  constructor(readonly canvas: HTMLCanvasElement, readonly stage: HTMLElement, visualVariant: VisualVariant = 'production', mapStyle: MapStyleMode = 'auto') {
    const context = canvas.getContext('2d', { alpha: true });
    if (!context) throw new Error('Canvas 2D is unavailable.');
    this.context = context;
    this.mapCanvas = this.createLayerCanvas('mapArtCanvas');
    this.environmentCanvas = this.createLayerCanvas('environmentCanvas');
    const mapContext = this.mapCanvas.getContext('2d', { alpha: false });
    const environmentContext = this.environmentCanvas.getContext('2d', { alpha: true });
    if (!mapContext || !environmentContext) throw new Error('Canvas 2D layers are unavailable.');
    this.mapContext = mapContext;
    this.environmentContext = environmentContext;
    canvas.before(this.mapCanvas, this.environmentCanvas);
    this.landscape = new LandscapeRenderer(undefined, visualVariant);
    this.mapArt = new MapArtRenderer(mapStyle, () => {
      this.mapLayerDirty = true;
      this.environmentLayerDirty = true;
    });
  }

  async prepareLevel(levelIndex: number): Promise<PreparedMapStyle> {
    const style = await this.mapArt.prepare(levelIndex);
    this.mapLayerDirty = true;
    this.environmentLayerDirty = true;
    return style;
  }

  private createLayerCanvas(className: string): HTMLCanvasElement {
    const layer = document.createElement('canvas');
    layer.className = className;
    layer.setAttribute('aria-hidden', 'true');
    return layer;
  }

  resize(): boolean {
    const width = Math.max(1, this.stage.clientWidth); const height = Math.max(1, this.stage.clientHeight);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (width === this.width && height === this.height && ratio === this.pixelRatio) return false;
    this.width = width; this.height = height; this.pixelRatio = ratio;
    this.canvas.width = Math.round(width * ratio); this.canvas.height = Math.round(height * ratio);
    this.canvas.style.width = `${width}px`; this.canvas.style.height = `${height}px`;
    for (const layer of [this.mapCanvas, this.environmentCanvas]) {
      layer.width = Math.round(width * ratio); layer.height = Math.round(height * ratio);
      layer.style.width = `${width}px`; layer.style.height = `${height}px`;
    }
    this.context.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.mapContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.environmentContext.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.runtimeGeometry = calculateWorldGeometry(width, height);
    this.worldTransform = transformBetween(REFERENCE_WORLD_GEOMETRY, this.runtimeGeometry);
    this.selected = null; this.dragPosition = null; this.effects.particles.length = 0;
    this.mapLayerDirty = true; this.environmentLayerDirty = true;
    return true;
  }

  positionFor(col: number, row: number): Point {
    return positionFor(REFERENCE_WORLD_GEOMETRY, col, row);
  }

  screenPositionFor(point: Point): Point {
    return transformPoint(point, this.worldTransform);
  }

  worldPositionFor(point: Point): Point {
    return inverseTransformPoint(point, this.worldTransform);
  }

  geometrySnapshot(): { reference: WorldGeometry; runtime: WorldGeometry; transform: WorldTransform; pixelRatio: number } {
    return {
      reference: REFERENCE_WORLD_GEOMETRY,
      runtime: this.runtimeGeometry,
      transform: this.worldTransform,
      pixelRatio: this.pixelRatio,
    };
  }

  renderSnapshot(levelIndex: number): {
    mapArt: ReturnType<MapArtRenderer['status']>;
    coreScreenRect: { x: number; y: number; width: number; height: number };
    layers: readonly string[];
    reducedMotion: boolean;
    environmentAnimated: boolean;
    targetFps: number;
    fallbackFloorFps: number;
  } {
    return {
      mapArt: this.mapArt.status(levelIndex),
      coreScreenRect: this.mapArt.coreScreenRect(this.worldTransform, levelIndex),
      layers: MAP_ART_RENDER_LAYERS,
      reducedMotion: this.reducedMotion.matches,
      environmentAnimated: !this.reducedMotion.matches && document.visibilityState === 'visible',
      targetFps: 60,
      fallbackFloorFps: 30,
    };
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

  draw(state: GameState, time = performance.now()): void {
    const mapArtEnabled = this.mapArt.supports(state.currentLevel);
    if (this.lastMapArtLevel !== state.currentLevel) {
      this.lastMapArtLevel = state.currentLevel;
      this.mapLayerDirty = true;
      this.environmentLayerDirty = true;
      this.lastEnvironmentFrame = -Infinity;
    }
    this.mapCanvas.style.display = mapArtEnabled ? 'block' : 'none';
    this.environmentCanvas.style.display = mapArtEnabled ? 'block' : 'none';
    if (mapArtEnabled) this.drawMapLayers(state, time);
    this.context.clearRect(0, 0, this.width, this.height);
    if (!mapArtEnabled) this.landscape.backdrop(this.context, this.width, this.height, state.currentLevel);
    this.context.save();
    this.context.transform(this.worldTransform.scale, 0, 0, this.worldTransform.scale, this.worldTransform.translateX, this.worldTransform.translateY);
    const reachable = this.selected ? new Set(state.hexes.filter((hex) => state.canSend(this.selected, hex))) : null;
    const phase = this.reducedMotion.matches || document.visibilityState !== 'visible' ? 0 : time / 1000;
    if (mapArtEnabled) {
      this.drawGrid(state.hexes);
      for (const hex of state.hexes) if (isPlayable(hex)) this.drawTerritory(hex, reachable, phase);
      for (const hex of state.hexes) if (isPlayable(hex)) this.drawStructure(hex);
      for (const hex of state.hexes) if (isPlayable(hex)) this.drawGarrison(hex);
    } else {
      for (const hex of state.hexes) this.drawLegacyHex(state, hex, reachable);
      this.landscape.drawWaterShores(this.context, state.hexes, this.radius, state.level.landscapeStyle, BoardRenderer.path, phase);
    }
    this.drawStrategicStructures(state, phase);
    for (const army of state.armies) {
      this.context.save(); this.context.globalAlpha = army.kind === 'supply' ? .24 : .18; this.context.strokeStyle = army.kind === 'supply' ? '#e8c07d' : OWNER_COLORS[army.owner].edge;
      this.context.lineWidth = army.kind === 'supply' ? 2 : 1.5; this.context.beginPath(); this.context.moveTo(army.x0, army.y0); this.context.lineTo(army.cx, army.cy); this.context.stroke(); this.context.restore();
      this.drawArmy(army.owner, army.units, army.cx, army.cy, army.kind === 'supply');
    }
    this.effects.draw(this.context);
    this.drawDrag(state);
    this.context.restore();
  }

  private drawMapLayers(state: GameState, time: number): void {
    if (this.mapLayerDirty) {
      this.mapContext.clearRect(0, 0, this.width, this.height);
      this.mapArt.drawBackdrop(this.mapContext, this.width, this.height, state.currentLevel);
      this.mapContext.save();
      this.mapContext.transform(this.worldTransform.scale, 0, 0, this.worldTransform.scale, this.worldTransform.translateX, this.worldTransform.translateY);
      const coreLoaded = this.mapArt.drawCore(this.mapContext, state.currentLevel);
      this.mapContext.restore();
      this.mapLayerDirty = !coreLoaded;
    }
    const animated = !this.reducedMotion.matches && document.visibilityState === 'visible';
    if (!this.environmentLayerDirty && (!animated || time - this.lastEnvironmentFrame < 1000 / 15)) return;
    const phase = animated ? time / 1000 : 0;
    this.environmentContext.clearRect(0, 0, this.width, this.height);
    this.environmentContext.save();
    this.environmentContext.transform(this.worldTransform.scale, 0, 0, this.worldTransform.scale, this.worldTransform.translateX, this.worldTransform.translateY);
    const assetWater = this.mapArt.drawWaterMotion(this.environmentContext, state.currentLevel, phase);
    if (!assetWater) {
      this.landscape.drawWaterShores(this.environmentContext, state.hexes, this.radius, state.level.landscapeStyle, BoardRenderer.path, phase, true);
    }
    this.environmentContext.restore();
    this.mapArt.drawAtmosphere(this.environmentContext, this.width, this.height, this.runtimeGeometry, phase, state.currentLevel);
    this.environmentLayerDirty = false;
    this.lastEnvironmentFrame = time;
  }

  private drawLegacyHex(state: GameState, hex: HexState, reachable: Set<HexState> | null): void {
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
    if (hex.terrain === Terrain.Base && this.structureAssets.drawHq(this.context, hex.owner, hex.x, hex.y, this.radius)) {
      this.drawNumberBadge(hex.owner, Math.floor(hex.units), hex.x, hex.y + this.radius * .58);
    } else if (state.structureAt(hex.col, hex.row)?.type !== 'guardian') {
      this.terrainGlyph(hex);
      this.context.fillStyle = colors.text; this.context.font = `700 ${Math.max(11, Math.floor(this.radius * .52))}px system-ui,sans-serif`;
      this.context.textAlign = 'center'; this.context.textBaseline = 'middle'; this.context.fillText(String(Math.floor(hex.units)), hex.x, hex.y - this.radius * .04);
    }
  }

  private drawGrid(hexes: readonly HexState[]): void {
    this.context.save();
    this.context.lineJoin = 'round';
    for (const hex of hexes) {
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * .955);
      const inactive = !isPlayable(hex);
      // Decorative and void cells never communicate an available move: keep their
      // contour intentionally quieter than the inner playable-cell border.
      this.context.strokeStyle = inactive ? 'rgba(29,52,43,.18)' : 'rgba(37,55,38,.28)';
      this.context.lineWidth = inactive ? .9 : 1.2;
      this.context.stroke();
      if (isPlayable(hex)) {
        BoardRenderer.path(this.context, hex.x, hex.y, this.radius * .92);
        this.context.strokeStyle = 'rgba(244,240,221,.68)';
        this.context.lineWidth = 1.9;
        this.context.stroke();
      }
    }
    this.context.restore();
  }

  private drawTerritory(hex: HexState, reachable: Set<HexState> | null, phase: number): void {
    const colors = OWNER_COLORS[hex.owner];
    const load = hex.owner === Owner.Neutral ? .36 : Math.max(0, Math.min(1, hex.units / terrainCapacity(hex)));
    BoardRenderer.path(this.context, hex.x, hex.y, this.radius * .91);
    this.context.save();
    this.context.globalAlpha = hex.owner === Owner.Neutral ? .18 : .36 + load * .096;
    this.context.fillStyle = mix(colors.low, colors.high, load);
    this.context.fill();
    this.context.restore();
    if (reachable && hex !== this.selected && !reachable.has(hex)) {
      this.context.fillStyle = 'rgba(25,35,29,.22)'; this.context.fill();
    }
    if (hex.owner !== Owner.Neutral) {
      this.context.strokeStyle = colors.edge;
      this.context.globalAlpha = .92;
      this.context.lineWidth = hex.terrain === Terrain.Base ? 2.8 : 2.15;
      this.context.stroke();
      this.context.globalAlpha = 1;
    }
    if (reachable && hex !== this.selected && reachable.has(hex)) {
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * .82);
      this.context.strokeStyle = 'rgba(248,221,157,.86)';
      this.context.lineWidth = 2.35;
      this.context.stroke();
    }
    if (hex.flash > 0) {
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * (.94 + hex.flash * .08));
      this.context.strokeStyle = '#fff2c8'; this.context.globalAlpha = Math.min(1, hex.flash * 2);
      this.context.lineWidth = 3; this.context.stroke(); this.context.globalAlpha = 1;
    }
    if (hex.siege) {
      const pulse = .72 + Math.sin(phase * 9) * .08;
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * pulse);
      this.context.strokeStyle = '#f3c966'; this.context.lineWidth = 3.5; this.context.stroke();
      this.context.fillStyle = 'rgba(213,106,97,.12)'; this.context.fill();
    }
    if (this.selected === hex) {
      BoardRenderer.path(this.context, hex.x, hex.y, this.radius * 1.01);
      this.context.strokeStyle = '#f0b14a'; this.context.lineWidth = 3.6; this.context.stroke();
    }
  }

  private drawStructure(hex: HexState): void {
    if (hex.terrain !== Terrain.Base) return;
    if (this.structureAssets.drawHq(this.context, hex.owner, hex.x, hex.y, this.radius)) return;
    const colors = OWNER_COLORS[hex.owner];
    const size = this.radius;
    this.context.save();
    this.context.translate(hex.x, hex.y);
    this.context.fillStyle = 'rgba(15,23,22,.35)';
    this.context.beginPath(); this.context.ellipse(0, size * .16, size * .48, size * .27, 0, 0, Math.PI * 2); this.context.fill();
    for (let index = 0; index < 4; index += 1) {
      this.context.save(); this.context.rotate(index * Math.PI / 2);
      this.context.fillStyle = '#6f7770'; this.context.strokeStyle = '#333c3a'; this.context.lineWidth = 1.3;
      this.context.beginPath(); this.context.moveTo(-size * .13, -size * .12); this.context.lineTo(size * .13, -size * .12);
      this.context.lineTo(size * .22, -size * .49); this.context.lineTo(-size * .22, -size * .49); this.context.closePath();
      this.context.fill(); this.context.stroke(); this.context.restore();
    }
    this.context.beginPath(); this.context.arc(0, 0, size * .3, 0, Math.PI * 2);
    this.context.fillStyle = '#4a5350'; this.context.fill();
    this.context.strokeStyle = colors.edge; this.context.lineWidth = 3.2; this.context.stroke();
    this.context.beginPath(); this.context.arc(0, -size * .035, size * .16, 0, Math.PI * 2);
    this.context.fillStyle = '#aab1a4'; this.context.fill();
    this.context.strokeStyle = 'rgba(244,240,221,.7)'; this.context.lineWidth = 1.2; this.context.stroke();
    this.context.restore();
  }

  private drawStrategicStructures(state: GameState, phase: number): void {
    const byId = new Map(state.structures.map((structure) => [structure.id, structure]));
    const byCell = new Map(state.hexes.map((hex) => [`${hex.col},${hex.row}`, hex]));
    this.context.save();
    for (const guardian of state.structures.filter((structure) => structure.type === 'guardian')) {
      if (!guardian.linkedTo) continue;
      const hq = byId.get(guardian.linkedTo); const from = byCell.get(`${guardian.col},${guardian.row}`); const to = hq && byCell.get(`${hq.col},${hq.row}`);
      if (!from || !to) continue;
      const active = guardian.status === 'active' && guardian.shield > 0;
      this.context.beginPath(); this.context.moveTo(from.x, from.y); this.context.lineTo(to.x, to.y);
      this.context.strokeStyle = active ? OWNER_COLORS[guardian.owner].high : 'rgba(111,119,112,.55)';
      this.context.globalAlpha = active ? .46 + Math.sin(phase * 2.1 + guardian.col) * .08 : .28;
      this.context.lineWidth = active ? 2.2 : 1.3; this.context.setLineDash(active ? [7, 6] : [3, 7]); this.context.stroke();
    }
    this.context.setLineDash([]); this.context.globalAlpha = 1;
    for (const structure of state.structures) {
      const hex = byCell.get(`${structure.col},${structure.row}`);
      if (!hex) continue;
      if (structure.type === 'guardian') {
        this.drawGuardian(structure, hex, phase);
        this.drawNumberBadge(hex.owner, Math.floor(hex.units), hex.x, hex.y + this.radius * .62);
      } else if (structure.type === 'hq') {
        const shield = hqShield(state.structures, structure.id);
        if (shield.current > 0) this.drawHqShield(hex, structure, shield.current, shield.maximum, phase);
      }
    }
    this.context.restore();
  }

  private drawGuardian(structure: StructureState, hex: HexState, phase: number): void {
    const colors = OWNER_COLORS[structure.owner]; const size = this.radius; const active = structure.status === 'active' && structure.shield > 0;
    if (this.structureAssets.drawGuardian(this.context, hex.x, hex.y, size)) {
      this.context.save();
      this.context.beginPath();
      this.context.arc(hex.x, hex.y, size * (.42 + (active ? Math.sin(phase * 2.4 + structure.col) * .018 : 0)), 0, Math.PI * 2);
      this.context.strokeStyle = active ? colors.high : '#788079';
      this.context.globalAlpha = active ? .62 : .72;
      this.context.lineWidth = active ? 2.4 : 1.7;
      this.context.stroke();
      if (!active) {
        this.context.globalAlpha = 1;
        this.context.strokeStyle = '#d9c8a7';
        this.context.lineWidth = 2;
        this.context.beginPath();
        this.context.moveTo(hex.x - size * .1, hex.y - size * .08);
        this.context.lineTo(hex.x + size * .1, hex.y + size * .09);
        this.context.moveTo(hex.x + size * .1, hex.y - size * .08);
        this.context.lineTo(hex.x - size * .1, hex.y + size * .09);
        this.context.stroke();
      }
      this.context.restore();
      return;
    }
    this.context.save(); this.context.translate(hex.x, hex.y - size * .04);
    this.context.fillStyle = 'rgba(13,20,18,.38)'; this.context.beginPath(); this.context.ellipse(0, size * .18, size * .4, size * .22, 0, 0, Math.PI * 2); this.context.fill();
    this.context.beginPath();
    for (let index = 0; index < 6; index += 1) {
      const angle = (index * Math.PI) / 3 - Math.PI / 2; const radius = size * .33;
      const x = Math.cos(angle) * radius; const y = Math.sin(angle) * radius * .72;
      if (index) this.context.lineTo(x, y); else this.context.moveTo(x, y);
    }
    this.context.closePath(); this.context.fillStyle = '#46514e'; this.context.fill();
    this.context.strokeStyle = active ? colors.edge : '#788079'; this.context.lineWidth = active ? 3 : 1.8; this.context.stroke();
    this.context.fillStyle = '#89918a'; this.context.fillRect(-size * .13, -size * .28, size * .26, size * .39);
    this.context.strokeStyle = '#303a37'; this.context.lineWidth = 1.2; this.context.strokeRect(-size * .13, -size * .28, size * .26, size * .39);
    this.context.beginPath(); this.context.arc(0, -size * .24, size * .11, 0, Math.PI * 2);
    this.context.fillStyle = active ? colors.high : '#69716b'; this.context.fill();
    if (active) {
      this.context.beginPath(); this.context.arc(0, 0, size * (.41 + Math.sin(phase * 2.4 + structure.col) * .018), 0, Math.PI * 2);
      this.context.strokeStyle = colors.high; this.context.globalAlpha = .58; this.context.lineWidth = 2; this.context.stroke(); this.context.globalAlpha = 1;
    } else {
      this.context.strokeStyle = '#d9c8a7'; this.context.lineWidth = 2;
      this.context.beginPath(); this.context.moveTo(-size * .1, -size * .08); this.context.lineTo(size * .1, size * .09);
      this.context.moveTo(size * .1, -size * .08); this.context.lineTo(-size * .1, size * .09); this.context.stroke();
    }
    this.context.restore();
  }

  private drawHqShield(hex: HexState, structure: StructureState, current: number, maximum: number, phase: number): void {
    const colors = OWNER_COLORS[structure.owner]; const ratio = maximum > 0 ? current / maximum : 0;
    this.context.save();
    this.context.beginPath(); this.context.arc(hex.x, hex.y, this.radius * (1.02 + Math.sin(phase * 1.8) * .012), 0, Math.PI * 2);
    this.context.fillStyle = colors.low; this.context.globalAlpha = .1 + ratio * .08; this.context.fill();
    this.context.strokeStyle = colors.high; this.context.globalAlpha = .62 + ratio * .2; this.context.lineWidth = 2.8; this.context.stroke();
    const label = `${this.shieldLabel} ${Math.ceil(current)}`; this.context.font = `800 ${Math.max(9, Math.floor(this.radius * .24))}px ui-monospace,monospace`;
    const width = this.context.measureText(label).width + 12; const y = hex.y - this.radius * 1.04;
    this.context.globalAlpha = .94; this.context.fillStyle = 'rgba(17,24,22,.92)'; this.context.fillRect(hex.x - width / 2, y - 9, width, 18);
    this.context.fillStyle = '#eef4ed'; this.context.textAlign = 'center'; this.context.textBaseline = 'middle'; this.context.fillText(label, hex.x, y);
    this.context.restore();
  }

  private drawGarrison(hex: HexState): void {
    if (hex.terrain !== Terrain.Base) this.terrainGlyph(hex);
    const centerY = hex.y + (hex.terrain === Terrain.Base ? this.radius * .58 : -this.radius * .04);
    this.drawNumberBadge(hex.owner, Math.floor(hex.units), hex.x, centerY);
  }

  private drawNumberBadge(owner: Owner, value: number, centerX: number, centerY: number): void {
    const colors = OWNER_COLORS[owner];
    const label = String(value);
    const fontSize = Math.max(11, Math.floor(this.radius * .43));
    const height = Math.max(18, this.radius * .54);
    this.context.save();
    this.context.font = `800 ${fontSize}px ui-monospace,monospace`;
    this.context.textAlign = 'center'; this.context.textBaseline = 'middle';
    const width = Math.max(height, this.context.measureText(label).width + this.radius * .3);
    const left = centerX - width / 2; const top = centerY - height / 2; const corner = Math.min(6, height * .28);
    this.context.beginPath();
    this.context.moveTo(left + corner, top);
    this.context.lineTo(left + width - corner, top);
    this.context.quadraticCurveTo(left + width, top, left + width, top + corner);
    this.context.lineTo(left + width, top + height - corner);
    this.context.quadraticCurveTo(left + width, top + height, left + width - corner, top + height);
    this.context.lineTo(left + corner, top + height);
    this.context.quadraticCurveTo(left, top + height, left, top + height - corner);
    this.context.lineTo(left, top + corner);
    this.context.quadraticCurveTo(left, top, left + corner, top);
    this.context.closePath();
    this.context.fillStyle = 'rgba(17,24,22,.9)'; this.context.fill();
    this.context.strokeStyle = owner === Owner.Neutral ? 'rgba(228,232,216,.58)' : colors.edge;
    this.context.lineWidth = owner === Owner.Neutral ? 1.1 : 1.6; this.context.stroke();
    if (owner !== Owner.Neutral) {
      this.context.beginPath();
      this.context.moveTo(left + corner, top + 1.4); this.context.lineTo(left + width - corner, top + 1.4);
      this.context.strokeStyle = colors.high; this.context.globalAlpha = .9; this.context.lineWidth = 2; this.context.stroke();
      this.context.globalAlpha = 1;
    }
    this.context.fillStyle = '#f5f2e7';
    this.context.fillText(label, centerX, centerY + .25);
    this.context.restore();
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
    const label = `${Math.floor(this.selected.units)}  →  ${sent} ${this.sendLabel}`;
    this.context.font = `700 ${Math.max(10, Math.floor(this.radius * .28))}px ui-monospace`; this.context.textAlign = 'center';
    const width = this.context.measureText(label).width + 16; const x = this.selected.x; const y = this.selected.y - this.radius * .72;
    this.context.fillStyle = 'rgba(25,36,31,.94)'; this.context.fillRect(x - width / 2, y - 11, width, 20);
    this.context.fillStyle = '#f4f0dd'; this.context.fillText(label, x, y);
  }
}
