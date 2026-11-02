import type { GameState } from '../core/GameState';
import { Owner, type HexState, type Point, type SendMode } from '../core/types';
import type { BoardRenderer } from '../rendering/BoardRenderer';
import { hexDistance, isPlayable } from '../core/hex';

export type InputError = 'decor' | 'target';

export interface InputCallbacks {
  getMode(): SendMode;
  onCommand(sent: number): void;
  onInvalid(error: InputError): void;
  onActivate(): void;
  canInteract?(): boolean;
  onGestureStart?(source: HexState, pointerType: string): void;
  onGestureMove?(source: HexState, target: HexState | null): void;
  onGestureEnd?(sent: number, source: HexState | null, target: HexState | null): void;
}

export class InputController {
  private pointerDown = false;
  private pressed: HexState | null = null;
  private origin: Point | null = null;
  private dragged = false;
  private cursor: HexState | null = null;
  private pointerId: number | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly state: GameState,
    private readonly renderer: BoardRenderer,
    private readonly callbacks: InputCallbacks,
  ) {
    canvas.addEventListener('pointerdown', this.onDown, { passive: false });
    canvas.addEventListener('pointermove', this.onMove, { passive: false });
    canvas.addEventListener('pointerup', this.onUp, { passive: false });
    canvas.addEventListener('pointercancel', this.cancel);
    canvas.addEventListener('lostpointercapture', this.onLostCapture);
    canvas.addEventListener('keydown', this.onKey);
    canvas.tabIndex = 0;
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('pointercancel', this.cancel);
    this.canvas.removeEventListener('lostpointercapture', this.onLostCapture);
    this.canvas.removeEventListener('keydown', this.onKey);
  }

  private point(event: PointerEvent): Point {
    const bounds = this.canvas.getBoundingClientRect();
    return this.renderer.worldPositionFor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  }

  private onDown = (event: PointerEvent): void => {
    if (!this.state.running || this.callbacks.canInteract?.() === false || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault(); this.callbacks.onActivate();
    const point = this.point(event); const hex = this.renderer.findHex(this.state, point);
    this.canvas.focus({ preventScroll: true });
    this.pressed = hex; this.origin = { x: event.clientX, y: event.clientY }; this.dragged = false;
    if (this.renderer.selected || hex?.owner === Owner.Player) {
      if (!this.renderer.selected && hex) this.select(hex, event.pointerType);
      this.pointerDown = true;
      this.pointerId = event.pointerId;
      this.canvas.setPointerCapture?.(event.pointerId);
    }
  };

  private onMove = (event: PointerEvent): void => {
    if (!this.pointerDown || !this.renderer.selected) return;
    if (event.pointerId !== this.pointerId) return;
    if (!this.dragged && this.origin && Math.hypot(event.clientX - this.origin.x, event.clientY - this.origin.y) < 7) return;
    if (!this.dragged && this.pressed?.owner === Owner.Player) this.select(this.pressed, event.pointerType);
    this.dragged = true;
    event.preventDefault(); this.renderer.dragPosition = this.point(event);
    this.callbacks.onGestureMove?.(this.renderer.selected, this.renderer.findHex(this.state, this.renderer.dragPosition));
  };

  private onUp = (event: PointerEvent): void => {
    if (event.pointerId !== this.pointerId) return;
    if (!this.pointerDown || !this.renderer.selected) { this.pointerDown = false; return; }
    event.preventDefault();
    const target = this.renderer.findHex(this.state, this.point(event)); const source = this.renderer.selected;
    this.pointerDown = false;
    if (this.callbacks.canInteract?.() === false) { this.cancel(); return; }
    if (target === source && !this.dragged) { this.renderer.dragPosition = null; return; }
    this.command(source, target);
  };

  private command(source: HexState, target: HexState | null): void {
    let sent = 0;
    if (target && target !== source && this.state.canSend(source, target)) {
      const mode = this.callbacks.getMode();
      if (mode === 'group') sent = this.state.sendGroup(target, Owner.Player, true, source);
      else {
        const amount = Math.floor(source.units * (mode === 'all' ? 1 : .5));
        if (this.state.send(source, target, Owner.Player, amount, true)) sent = amount;
      }
      if (sent > 0) this.callbacks.onCommand(sent);
    } else if (target && target !== source) {
      this.callbacks.onInvalid(target.owner === Owner.Neutral && target.decor
        ? 'decor'
        : 'target');
    }
    this.callbacks.onGestureEnd?.(sent, source, target);
    if (sent > 0 || !target) this.reset();
    else if (target.owner === Owner.Player) this.select(target, 'keyboard');
    else this.renderer.dragPosition = null;
  }

  private select(hex: HexState, pointerType: string): void {
    this.renderer.selected = hex; this.renderer.dragPosition = null; this.cursor = hex;
    this.callbacks.onGestureStart?.(hex, pointerType);
  }

  private onKey = (event: KeyboardEvent): void => {
    if (!this.state.running || this.callbacks.canInteract?.() === false) return;
    if (event.key === 'Escape' && this.renderer.selected) {
      event.preventDefault(); event.stopPropagation(); this.cancel(); return;
    }
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'Enter', ' '].includes(event.key)) return;
    event.preventDefault(); event.stopPropagation();
    this.callbacks.onActivate();
    const cells = this.state.hexes.filter(isPlayable);
    if (!this.cursor || !cells.includes(this.cursor)) this.cursor = cells.find(hex => hex.owner === Owner.Player) ?? cells[0];
    if (!this.cursor) return;
    if (event.key === 'Home') this.cursor = cells.find(hex => hex.owner === Owner.Player) ?? this.cursor;
    else if (event.key.startsWith('Arrow')) {
      const origin = this.cursor;
      const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
      const direction = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1;
      const candidates = cells.filter(hex => hex !== origin && (horizontal ? hex.x - origin.x : hex.y - origin.y) * direction > 1);
      candidates.sort((a, b) => {
        const adjacent = Number(hexDistance(origin, b) === 1) - Number(hexDistance(origin, a) === 1);
        if (adjacent) return adjacent;
        const score = (hex: HexState) => Math.hypot(hex.x - origin.x, hex.y - origin.y)
          + Math.abs(horizontal ? hex.y - origin.y : hex.x - origin.x) * 2;
        return score(a) - score(b);
      });
      this.cursor = candidates[0] ?? origin;
    } else if (!this.renderer.selected) {
      if (this.cursor.owner === Owner.Player) this.select(this.cursor, 'keyboard');
    } else if (this.cursor === this.renderer.selected) this.cancel();
    else this.command(this.renderer.selected, this.cursor);
    this.renderer.keyboardFocus = this.cursor;
    if (this.cursor && this.renderer.zoom > 1) {
      const point = this.renderer.screenPositionFor(this.cursor);
      this.renderer.stage.scrollLeft = point.x - this.renderer.stage.clientWidth / 2;
      this.renderer.stage.scrollTop = point.y - this.renderer.stage.clientHeight / 2;
    }
    if (this.renderer.selected) this.renderer.dragPosition = this.cursor;
  };

  private onLostCapture = (): void => { if (this.pointerDown) this.cancel(); };

  cancel = (): void => {
    const active = this.pointerDown && Boolean(this.renderer.selected);
    this.reset();
    if (active) this.callbacks.onGestureEnd?.(0, null, null);
  };

  private reset(): void {
    this.pointerDown = false; this.renderer.selected = null; this.renderer.dragPosition = null;
    this.pressed = null; this.origin = null;
    this.pointerId = null;
  }
}
