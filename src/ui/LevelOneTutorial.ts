import type { GameState } from '../core/GameState';
import type { HexState, Point } from '../core/types';
import type { I18n } from '../i18n/I18n';
import type { BoardRenderer } from '../rendering/BoardRenderer';

type TutorialPhase = 'hidden' | 'ready' | 'dragging' | 'release' | 'complete';
type TutorialPointer = 'mouse' | 'touch';

interface LevelOneTutorialCallbacks {
  showHint(message: string): void;
  hideHint(): void;
  showSuccess(message: string): void;
}

const ASSET_ROOT = './assets/tutorial/';

export class LevelOneTutorial {
  private readonly root: HTMLDivElement;
  private readonly origin: HTMLImageElement;
  private readonly arrow: HTMLImageElement;
  private readonly targetMarker: HTMLImageElement;
  private readonly desktopPointer: HTMLImageElement;
  private readonly touchHand: HTMLImageElement;
  private phase: TutorialPhase = 'hidden';
  private pointer: TutorialPointer = matchMedia('(pointer:coarse)').matches ? 'touch' : 'mouse';
  private source: HexState | null = null;
  private target: HexState | null = null;
  private assetsLoaded = false;
  private stopTimer = 0;

  constructor(
    private readonly stage: HTMLElement,
    private readonly renderer: BoardRenderer,
    private readonly i18n: I18n,
    private readonly callbacks: LevelOneTutorialCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'levelOneTutorial';
    this.root.className = 'levelOneTutorial';
    this.root.hidden = true;
    this.root.setAttribute('aria-hidden', 'true');

    this.origin = this.image('tutorialOrigin', 'origin beacon');
    this.arrow = this.image('tutorialArrow', 'command arrow');
    this.targetMarker = this.image('tutorialTarget', 'target marker');
    this.desktopPointer = this.image('tutorialGesture tutorialDesktopPointer', 'desktop drag pointer');
    this.touchHand = this.image('tutorialGesture tutorialTouchHand', 'touch drag gesture');
    this.root.append(this.origin, this.arrow, this.targetMarker, this.desktopPointer, this.touchHand);
    this.stage.append(this.root);
  }

  start(state: GameState): void {
    this.stop(false);
    if (state.currentLevel !== 0 || !state.running) return;
    const base = state.level.bases?.player;
    this.source = base ? state.hexAt(base.col, base.row) : null;
    this.target = this.source ? this.recommendedTarget(state, this.source) : null;
    if (!this.source || !this.target) return;

    this.loadAssets();
    this.pointer = matchMedia('(pointer:coarse)').matches ? 'touch' : 'mouse';
    this.root.hidden = false;
    this.setPhase('ready');
    this.updatePosition();
    this.refreshCopy();
  }

  stop(hideHint = true): void {
    window.clearTimeout(this.stopTimer);
    this.phase = 'hidden';
    this.root?.classList.remove('active', 'ready', 'dragging', 'release', 'repeat', 'complete');
    if (this.root) this.root.hidden = true;
    this.source = null;
    this.target = null;
    if (hideHint) this.callbacks.hideHint();
  }

  gestureStart(state: GameState, source: HexState, pointerType: string): void {
    if (!this.isActive(state)) return;
    this.pointer = pointerType === 'touch' || pointerType === 'pen' ? 'touch' : 'mouse';
    this.root.dataset.pointer = this.pointer;
    this.source = source;
    this.target = this.recommendedTarget(state, source);
    this.setPhase('dragging');
    this.updatePosition();
    this.refreshCopy();
  }

  gestureMove(state: GameState, target: HexState | null): void {
    if (!this.isActive(state) || !this.source) return;
    const valid = Boolean(target && target !== this.source && state.canSend(this.source, target));
    if (valid && target) {
      this.target = target;
      if (this.phase !== 'release') {
        this.setPhase('release');
        this.refreshCopy();
      }
      this.updatePosition();
      return;
    }
    if (this.phase === 'release') {
      this.target = this.recommendedTarget(state, this.source);
      this.setPhase('dragging');
      this.updatePosition();
      this.refreshCopy();
    }
  }

  gestureEnd(state: GameState, sent: number): void {
    if (!this.isActive(state)) return;
    if (sent <= 0) {
      if (this.source) this.target = this.recommendedTarget(state, this.source);
      this.setPhase('ready');
      this.updatePosition();
      this.refreshCopy();
      return;
    }

    this.setPhase('complete');
    this.callbacks.hideHint();
    this.callbacks.showSuccess(this.i18n.t('tutorial.success'));
    this.stopTimer = window.setTimeout(() => this.stop(false), 720);
  }

  updatePosition(): void {
    if (this.phase === 'hidden' || !this.source || !this.target) return;
    const source = this.renderer.screenPositionFor(this.source);
    const target = this.renderer.screenPositionFor(this.target);
    const radius = this.renderer.geometrySnapshot().runtime.radius;
    const dx = target.x - source.x;
    const dy = target.y - source.y;
    const distance = Math.hypot(dx, dy);
    const angle = Math.atan2(dy, dx) * 180 / Math.PI + 90;

    this.place(this.origin, source, radius * 2.85);
    this.place(this.targetMarker, target, radius * 2.55);
    this.arrow.style.left = `${source.x}px`;
    this.arrow.style.top = `${source.y}px`;
    this.arrow.style.width = `${Math.max(34, radius * 1.35)}px`;
    this.arrow.style.height = `${Math.max(64, distance * 1.17)}px`;
    this.arrow.style.transform = `translate(-50%,-91%) rotate(${angle}deg)`;

    const gestureSize = this.pointer === 'touch'
      ? Math.max(62, Math.min(96, radius * 2.05))
      : Math.max(44, Math.min(70, radius * 1.45));
    for (const gesture of [this.desktopPointer, this.touchHand]) {
      gesture.style.left = `${source.x}px`;
      gesture.style.top = `${source.y}px`;
      gesture.style.width = `${gestureSize}px`;
      gesture.style.setProperty('--tutorial-dx', `${dx}px`);
      gesture.style.setProperty('--tutorial-dy', `${dy}px`);
    }
  }

  refreshCopy(): void {
    if (this.phase === 'hidden' || this.phase === 'complete') return;
    if (this.phase === 'release') {
      this.callbacks.showHint(this.i18n.t('tutorial.release'));
      return;
    }
    if (this.phase === 'dragging') {
      this.callbacks.showHint(this.i18n.t('tutorial.drag'));
      return;
    }
    this.callbacks.showHint(this.i18n.t(this.pointer === 'touch' ? 'tutorial.touchStart' : 'tutorial.mouseStart'));
  }

  private isActive(state: GameState): boolean {
    return this.phase !== 'hidden' && this.phase !== 'complete' && state.currentLevel === 0 && state.running;
  }

  private recommendedTarget(state: GameState, source: HexState): HexState | null {
    const preferred = state.hexAt(3, 8);
    if (preferred && state.canSend(source, preferred)) return preferred;
    return state.hexes.find((candidate) => candidate !== source && state.canSend(source, candidate)) ?? null;
  }

  private setPhase(phase: Exclude<TutorialPhase, 'hidden'>): void {
    this.phase = phase;
    this.root.className = `levelOneTutorial active ${phase}`;
    this.root.dataset.pointer = this.pointer;
  }

  private place(element: HTMLElement, point: Point, size: number): void {
    element.style.left = `${point.x}px`;
    element.style.top = `${point.y}px`;
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
  }

  private image(className: string, description: string): HTMLImageElement {
    const image = document.createElement('img');
    image.className = className;
    image.alt = '';
    image.draggable = false;
    image.dataset.description = description;
    return image;
  }

  private loadAssets(): void {
    if (this.assetsLoaded) return;
    this.assetsLoaded = true;
    this.origin.src = `${ASSET_ROOT}tutorial-origin-beacon-v1.webp`;
    this.arrow.src = `${ASSET_ROOT}tutorial-command-arrow-v1.webp`;
    this.targetMarker.src = `${ASSET_ROOT}tutorial-target-marker-v1.webp`;
    this.desktopPointer.src = `${ASSET_ROOT}tutorial-desktop-pointer-v1.webp`;
    this.touchHand.src = `${ASSET_ROOT}tutorial-touch-hand-v1.webp`;
  }
}
