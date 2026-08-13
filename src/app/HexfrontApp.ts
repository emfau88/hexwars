import { AudioController } from '../audio/AudioController';
import { GameState } from '../core/GameState';
import { Owner, type CampaignProgress, type GameEvent, type SendMode } from '../core/types';
import { installDebugApi } from '../debug/DebugApi';
import { I18n } from '../i18n/I18n';
import type { Locale } from '../i18n/types';
import { InputController, type InputError } from '../input/InputController';
import { CampaignProgressStore } from '../persistence/CampaignProgressStore';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { OWNER_COLORS } from '../rendering/palette';
import { CampaignUI } from '../ui/CampaignUI';

export class HexfrontApp {
  readonly state = new GameState();
  readonly renderer: BoardRenderer;
  readonly ui: CampaignUI;
  readonly audio = new AudioController();
  readonly i18n = new I18n();
  readonly progressStore = new CampaignProgressStore();
  progress: CampaignProgress;
  sendMode: SendMode = 'half';
  private readonly input: InputController;
  private readonly parameters = new URLSearchParams(location.search);
  private readonly debugSpeed: number;
  private readonly debugUnlock: boolean;
  private lastFrame = performance.now();
  private animationFrame = 0;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
    const stage = document.getElementById('stage');
    if (!canvas || !stage) throw new Error('HEXFRONT canvas shell is incomplete.');
    this.debugSpeed = Math.max(1, Math.min(20, Number(this.parameters.get('speed')) || 1));
    this.debugUnlock = this.parameters.get('unlock') === '1';
    this.state.autoplay = this.parameters.get('autoplay') === '1';
    this.progress = this.progressStore.load();
    this.renderer = new BoardRenderer(canvas, stage);
    this.ui = new CampaignUI({
      startLevel: (index) => this.startLevel(index), showMap: (focus) => this.showMap(focus),
      setMode: (mode) => this.setMode(mode), toggleSound: () => this.toggleSound(),
      toggleFullscreen: () => void this.toggleFullscreen(), resetProgress: () => this.resetProgress(), activate: () => this.audio.activate(),
      setLocale: (locale) => this.setLocale(locale),
    }, this.i18n);
    this.input = new InputController(canvas, this.state, this.renderer, {
      getMode: () => this.sendMode,
      onCommand: () => { navigator.vibrate?.(10); this.audio.beep(410, .035, .03); },
      onInvalid: (error) => this.ui.showToast(this.i18n.t(this.inputErrorKey(error))), onActivate: () => this.audio.activate(),
      onFocus: (hex) => {
        if (!this.state.level.features.focus) return;
        if (this.state.toggleSupplyFocus(hex, Owner.Player)) {
          const focused = this.state.focusedFront(Owner.Player) === hex;
          this.ui.showToast(this.i18n.t(focused ? 'toast.focus.set' : 'toast.focus.cleared'));
        }
      },
    });
    this.bindWindowEvents();
    this.renderer.resize(this.state);
    this.showMap(this.progressStore.focus(this.progress));
    installDebugApi({
      startLevel: (index) => this.startLevel(index), showMap: () => this.showMap(), setAutoplay: (value) => { this.state.autoplay = value; },
      setOpponentEnabled: (value) => { this.state.opponentEnabled = value; },
      getState: () => ({ ...this.state.snapshot(), progress: this.progress }),
      getBoard: () => this.state.hexes.map(({ col, row, owner, units, terrain, decor, x, y }) => ({ col, row, owner, units, terrain, decor, x, y })),
      send: (fromCol, fromRow, toCol, toRow, fraction = .5) => {
        const from = this.state.hexAt(fromCol, fromRow); const to = this.state.hexAt(toCol, toRow);
        return Boolean(from && to && this.state.send(from, to, from.owner, Math.floor(from.units * fraction)));
      },
      think: (owner = Owner.Enemy) => this.state.think(owner, .9),
      simulate: (seconds = 300, step = .05) => { for (let index = 0; index < Math.ceil(seconds / step) && this.state.running; index += 1) this.state.update(step); this.consumeEvents(); return this.state.snapshot(); },
      debugWin: () => { this.state.end('victory', 'debugVictory'); this.consumeEvents(); }, resetProgress: () => this.resetProgress(true),
    });
    const requestedLevel = Number(this.parameters.get('level'));
    if (this.parameters.get('autostart') === '1') this.startLevel(Number.isFinite(requestedLevel) ? requestedLevel : 0);
    this.ui.refreshLanguage(this.state, this.audio.enabled);
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  startLevel(index = this.state.currentLevel): void {
    this.audio.activate(); this.renderer.resize();
    this.state.start(index, (col, row) => this.renderer.positionFor(col, row));
    this.sendMode = 'half'; this.renderer.sendMode = this.sendMode;
    this.ui.startMission(this.state); this.ui.setMode(this.sendMode, this.state); this.audio.beep(220, .045, .035);
    this.lastFrame = performance.now();
  }

  showMap(focus = this.state.currentLevel): void {
    this.state.running = false;
    this.ui.showMap(this.progress, (index) => this.progressStore.isUnlocked(this.progress, index, this.debugUnlock), focus);
  }

  setMode(mode: SendMode): void {
    const features = this.state.level.features;
    if ((mode === 'all' && !features.all) || (mode === 'group' && !features.group)) return;
    this.sendMode = mode; this.renderer.sendMode = mode; this.ui.setMode(mode, this.state);
    this.ui.showToast(this.i18n.t(mode === 'half' ? 'toast.mode.half' : mode === 'all' ? 'toast.mode.all' : 'toast.mode.group'));
  }

  private frame = (time: number): void => {
    const delta = Math.min(.05, (time - this.lastFrame) / 1000); this.lastFrame = time;
    if (this.state.running) {
      this.state.update(delta * this.debugSpeed); this.renderer.effects.update(delta * this.debugSpeed); this.ui.updateHUD(this.state);
    }
    this.consumeEvents();
    this.renderer.draw(this.state); this.animationFrame = requestAnimationFrame(this.frame);
  };

  private consumeEvents(): void {
    for (const event of this.state.drainEvents()) this.handleEvent(event);
  }

  private handleEvent(event: GameEvent): void {
    if (event.type === 'send') this.renderer.effects.burst(event.detail.from, OWNER_COLORS[event.detail.owner].edge, 5);
    if (event.type === 'arrival' && event.detail.kind !== 'supply') this.audio.beep(145, .035, .02);
    if (event.type === 'capture') {
      this.renderer.effects.burst(event.detail.target, OWNER_COLORS[event.detail.newOwner].edge, 14);
      if (event.detail.newOwner === Owner.Player || event.detail.oldOwner === Owner.Player) this.audio.beep(event.detail.newOwner === Owner.Player ? 560 : 105, .08, .05);
    }
    if (event.type === 'endgame') { this.ui.updateEndgame(this.state); this.ui.showToast(this.i18n.t(event.detail.stage === 1 ? 'toast.endgame.decline' : 'toast.endgame.decision')); }
    if (event.type === 'result') {
      if (event.detail.result === 'victory') {
        this.progress = this.progressStore.complete(this.progress, this.state.currentLevel, this.state.elapsed);
        this.audio.beep(680, .12, .075); window.setTimeout(() => this.audio.beep(880, .15, .065), 100);
      } else this.audio.beep(95, .22, .075);
      this.ui.showResult(this.state);
    }
  }

  private toggleSound(): void { this.ui.syncSound(this.audio.toggle()); }

  private async toggleFullscreen(): Promise<void> {
    this.audio.activate();
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { this.ui.showToast(this.i18n.t('toast.fullscreenFailed')); }
    this.ui.syncFullscreen(); this.renderer.resize(this.state);
  }

  private resetProgress(skipConfirmation = false): void {
    if (!skipConfirmation && !confirm(this.i18n.t('settings.resetConfirm'))) return;
    this.progress = this.progressStore.reset(); this.showMap(0);
  }

  private setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
    this.ui.refreshLanguage(this.state, this.audio.enabled);
  }

  private inputErrorKey(error: InputError): 'toast.invalid.decor' | 'toast.invalid.target' {
    return error === 'decor' ? 'toast.invalid.decor' : 'toast.invalid.target';
  }

  private bindWindowEvents(): void {
    const resize = () => { this.renderer.resize(this.state); if (this.ui.menu.classList.contains('show')) this.ui.selectLevel(this.ui.selectedMenuLevel, this.progress, (index) => this.progressStore.isUnlocked(this.progress, index, this.debugUnlock), false); };
    window.addEventListener('resize', resize); window.addEventListener('orientationchange', () => window.setTimeout(resize, 120)); document.addEventListener('fullscreenchange', resize);
    window.addEventListener('keydown', (event) => {
      if (event.key === '1') this.setMode('half'); if (event.key === '2') this.setMode('all'); if (event.key === '3') this.setMode('group');
      if (event.key.toLowerCase() === 'r') this.startLevel(); if (event.key === 'Escape') this.showMap();
    });
  }
}
