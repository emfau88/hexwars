import type { GameState } from '../core/GameState';
import { Owner, type HexState, type Point, type SendMode } from '../core/types';
import type { BoardRenderer } from '../rendering/BoardRenderer';

export type InputError = 'decor' | 'target';

export interface InputCallbacks {
  getMode(): SendMode;
  onCommand(sent: number): void;
  onInvalid(error: InputError): void;
  onActivate(): void;
  onGestureStart?(source: HexState, pointerType: string): void;
  onGestureMove?(source: HexState, target: HexState | null): void;
  onGestureEnd?(sent: number, source: HexState | null, target: HexState | null): void;
}

export class InputController {
  private pointerDown = false;

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
  }

  destroy(): void {
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointermove', this.onMove);
    this.canvas.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('pointercancel', this.cancel);
  }

  private point(event: PointerEvent): Point {
    const bounds = this.canvas.getBoundingClientRect();
    return this.renderer.worldPositionFor({ x: event.clientX - bounds.left, y: event.clientY - bounds.top });
  }

  private onDown = (event: PointerEvent): void => {
    if (!this.state.running) return;
    event.preventDefault(); this.callbacks.onActivate();
    const point = this.point(event); const hex = this.renderer.findHex(this.state, point);
    if (hex?.owner === Owner.Player && hex.units >= 2) {
      this.renderer.selected = hex; this.renderer.dragPosition = point; this.pointerDown = true;
      this.canvas.setPointerCapture?.(event.pointerId);
      this.callbacks.onGestureStart?.(hex, event.pointerType);
    }
  };

  private onMove = (event: PointerEvent): void => {
    if (!this.pointerDown || !this.renderer.selected) return;
    event.preventDefault(); this.renderer.dragPosition = this.point(event);
    this.callbacks.onGestureMove?.(this.renderer.selected, this.renderer.findHex(this.state, this.renderer.dragPosition));
  };

  private onUp = (event: PointerEvent): void => {
    if (!this.pointerDown || !this.renderer.selected) { this.pointerDown = false; return; }
    event.preventDefault();
    const target = this.renderer.findHex(this.state, this.point(event)); const source = this.renderer.selected;
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
    this.reset();
  };

  private cancel = (): void => {
    const active = this.pointerDown && Boolean(this.renderer.selected);
    this.reset();
    if (active) this.callbacks.onGestureEnd?.(0, null, null);
  };

  private reset(): void {
    this.pointerDown = false; this.renderer.selected = null; this.renderer.dragPosition = null;
  }
}
