import { AudioController } from '../audio/AudioController';
import { GameState } from '../core/GameState';
import { Owner, type CampaignProgress, type GameEvent, type SendMode, type VisualVariant } from '../core/types';
import { installDebugApi } from '../debug/DebugApi';
import { I18n } from '../i18n/I18n';
import type { Locale } from '../i18n/types';
import { InputController, type InputError } from '../input/InputController';
import { CampaignProgressStore } from '../persistence/CampaignProgressStore';
import { KongregateStats } from '../platform/KongregateStats';
import { BoardRenderer } from '../rendering/BoardRenderer';
import type { MapStyleMode } from '../rendering/MapArtRenderer';
import { OWNER_COLORS } from '../rendering/palette';
import { CampaignUI } from '../ui/CampaignUI';
import { LevelOneTutorial } from '../ui/LevelOneTutorial';
import { GuardianBriefing } from '../ui/GuardianBriefing';
import { RelayTutorial } from '../ui/RelayTutorial';
import { LEVELS } from '../levels';

const DEBUG_ENABLED = import.meta.env.DEV || import.meta.env.MODE === 'test';
const DEBUG_PARAMETERS = DEBUG_ENABLED ? new URLSearchParams(location.search) : null;
const DEBUG_SPEED = Math.max(1, Math.min(20, Number(DEBUG_PARAMETERS?.get('speed')) || 1));
const DEBUG_UNLOCK = DEBUG_PARAMETERS?.get('unlock') === '1';
const DEBUG_AUTOPLAY = DEBUG_PARAMETERS?.get('autoplay') === '1';
const DEBUG_AUTOSTART = DEBUG_PARAMETERS?.get('autostart') === '1';
const DEBUG_LEVEL = Number(DEBUG_PARAMETERS?.get('level'));
const REQUESTED_VISUAL = DEBUG_PARAMETERS?.get('visual');
const VISUAL_VARIANT: VisualVariant = REQUESTED_VISUAL === 'production' || REQUESTED_VISUAL === 'decor-p1'
  || REQUESTED_VISUAL === 'decor-p2' || REQUESTED_VISUAL === 'decor-v2' ? REQUESTED_VISUAL : 'decor-v2';
const REQUESTED_MAP_STYLE = /(?:^|[?&])mapStyle=(classic|modern)(?:&|$)/.exec(location.search)?.[1];
const MAP_STYLE: MapStyleMode = REQUESTED_MAP_STYLE === 'classic' || REQUESTED_MAP_STYLE === 'modern'
  ? REQUESTED_MAP_STYLE
  : 'auto';

export class HexfrontApp {
  readonly state = new GameState();
  readonly renderer: BoardRenderer;
  readonly ui: CampaignUI;
  readonly tutorial: LevelOneTutorial;
  readonly guardianBriefing: GuardianBriefing;
  readonly relayTutorial: RelayTutorial;
  readonly audio = new AudioController();
  readonly i18n = new I18n();
  readonly progressStore = new CampaignProgressStore();
  readonly kongregateStats = new KongregateStats();
  progress: CampaignProgress;
  sendMode: SendMode = 'all';
  private readonly input: InputController;
  private readonly visualVariant = VISUAL_VARIANT;
  private stageResizeObserver: ResizeObserver | null = null;
  private resizeFrame = 0;
  private lastFrame = performance.now();
  private animationFrame = 0;
  private levelStartRequest = 0;
  private waitingForFirstMove = false;
  private waitingForBriefing = false;

  constructor() {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement | null;
    const stage = document.getElementById('stage');
    if (!canvas || !stage) throw new Error('HEXFRONT canvas shell is incomplete.');
    this.state.autoplay = DEBUG_AUTOPLAY;
    this.progress = this.progressStore.load();
    this.renderer = new BoardRenderer(canvas, stage, this.visualVariant, MAP_STYLE);
    this.renderer.sendLabel = this.i18n.t('drag.send');
    this.renderer.shieldLabel = this.i18n.t('guardian.shield');
    this.ui = new CampaignUI({
      startLevel: (index) => this.startLevel(index), showMap: (focus) => this.showMap(focus),
      setMode: (mode) => this.setMode(mode), toggleSound: () => this.toggleSound(),
      togglePlayerSupply: () => this.togglePlayerSupply(),
      toggleFullscreen: () => void this.toggleFullscreen(), resetProgress: () => this.resetProgress(), activate: () => this.audio.activate(),
      setLocale: (locale) => this.setLocale(locale),
    }, this.i18n, this.visualVariant, MAP_STYLE);
    this.tutorial = new LevelOneTutorial(stage, this.renderer, this.i18n, {
      showHint: (message) => this.ui.showTutorialHint(message),
      hideHint: () => this.ui.hideTutorialHint(),
      showSuccess: (message) => this.ui.showToast(message),
    });
    this.guardianBriefing = new GuardianBriefing(stage, this.renderer, this.i18n, {
      onOpen: () => { this.waitingForBriefing = true; },
      onClose: (introduction) => {
        this.waitingForBriefing = false;
        if (introduction) this.progress = this.progressStore.markGuardianBriefingSeen(this.progress);
      },
    });
    this.relayTutorial = new RelayTutorial(stage, this.renderer, this.i18n, {
      onOpen: () => { this.waitingForBriefing = true; },
      onClose: (introduction, levelId) => {
        this.waitingForBriefing = false;
        if (introduction) this.progress = levelId === 'signal-gardens'
          ? this.progressStore.markRelayMasteryBriefingSeen(this.progress)
          : this.progressStore.markRelayBriefingSeen(this.progress);
      },
      onComplete: (levelId) => {
        this.progress = levelId === 'signal-gardens'
          ? this.progressStore.markRelayMasteryUsed(this.progress)
          : this.progressStore.markRelaySendUsed(this.progress);
      },
      showHint: (message) => this.ui.showTutorialHint(message),
      hideHint: () => this.ui.hideTutorialHint(),
      showSuccess: (message) => this.ui.showToast(message),
    });
    this.input = new InputController(canvas, this.state, this.renderer, {
      getMode: () => this.sendMode,
      onCommand: () => {
        this.beginLevelOneBattle();
        if (this.state.currentLevel === 1 && this.sendMode === 'half') {
          this.progress = this.progressStore.markHalfSendUsed(this.progress);
        }
        this.ui.acknowledgeCommand(this.state, this.sendMode, this.progress);
        navigator.vibrate?.(10); this.audio.play('send');
      },
      onInvalid: (error) => { this.audio.play('denied'); this.ui.showToast(this.i18n.t(this.inputErrorKey(error))); }, onActivate: () => this.audio.activate(),
      onGestureStart: (source, pointerType) => {
        this.tutorial.gestureStart(this.state, source, pointerType);
        this.relayTutorial.gestureStart(this.state, source);
      },
      onGestureMove: (source, target) => {
        this.tutorial.gestureMove(this.state, target);
        this.relayTutorial.gestureMove(this.state, source, target);
      },
      onGestureEnd: (sent, source, target) => {
        this.tutorial.gestureEnd(this.state, sent);
        this.relayTutorial.gestureEnd(this.state, sent, source, target);
      },
    });
    this.showMap(this.progressStore.focus(this.progress));
    this.bindWindowEvents();
    this.resizeLayout();
    this.kongregateStats.initialize(() => this.submitCampaignStatistics());
    if (DEBUG_ENABLED) {
      installDebugApi({
        startLevel: (index) => this.startLevel(index), showMap: () => this.showMap(), setAutoplay: (value) => {
          this.state.autoplay = value;
          if (value) this.beginLevelOneBattle();
        },
        setOpponentEnabled: (value) => { this.state.opponentEnabled = value; },
        getState: () => ({ ...this.state.snapshot(), progress: this.progress, waitingForFirstMove: this.waitingForFirstMove, waitingForBriefing: this.waitingForBriefing }),
        getBoard: () => this.state.hexes.map(({ col, row, owner, units, terrain, decor, x, y }) => ({
          col, row, owner, units, terrain, decor, ...this.renderer.screenPositionFor({ x, y }),
        })),
        getStructures: () => this.state.structures.map((structure) => ({ ...structure })),
        getGeometry: () => this.renderer.geometrySnapshot(),
        getRenderProfile: () => this.renderer.renderSnapshot(this.state.currentLevel),
        measureRenderCost: (samples = 60) => {
          const count = Math.max(1, Math.min(240, Math.floor(samples)));
          const timings: number[] = [];
          const timelineStart = performance.now();
          for (let index = 0; index < count; index += 1) {
            const started = performance.now();
            this.renderer.draw(this.state, timelineStart + index * (1000 / 60));
            timings.push(performance.now() - started);
          }
          timings.sort((left, right) => left - right);
          return {
            samples: count,
            averageMs: timings.reduce((sum, value) => sum + value, 0) / count,
            medianMs: timings[Math.floor(count * .5)],
            p95Ms: timings[Math.min(count - 1, Math.floor(count * .95))],
            frameBudgetMs: 1000 / 60,
          };
        },
        send: (fromCol, fromRow, toCol, toRow, fraction = .5) => {
          const from = this.state.hexAt(fromCol, fromRow); const to = this.state.hexAt(toCol, toRow);
          const sent = Boolean(from && to && this.state.send(from, to, from.owner, Math.floor(from.units * fraction)));
          if (sent && from?.owner === Owner.Player) this.beginLevelOneBattle();
          return sent;
        },
        think: (owner = Owner.Enemy) => this.state.think(owner, .9),
        simulate: (seconds = 300, step = .05) => {
          for (let index = 0; index < Math.ceil(seconds / step) && this.state.running && !this.simulationPaused(); index += 1) this.state.update(step);
          this.consumeEvents(); return this.state.snapshot();
        },
        debugWin: () => { this.state.end('victory', 'debugVictory'); this.consumeEvents(); },
        debugDefeat: () => { this.state.end('defeat', 'playerBaseCaptured'); this.consumeEvents(); },
        resetProgress: () => this.resetProgress(true),
      });
      if (DEBUG_AUTOSTART) this.startLevel(Number.isFinite(DEBUG_LEVEL) ? DEBUG_LEVEL : 0);
    }
    this.ui.refreshLanguage(this.state, this.audio.enabled);
    this.animationFrame = requestAnimationFrame(this.frame);
  }

  startLevel(index = this.state.currentLevel): void {
    void this.prepareAndStartLevel(index);
  }

  private async prepareAndStartLevel(index: number): Promise<void> {
    const request = ++this.levelStartRequest;
    this.audio.activate();
    this.ui.setMapLoading(true);
    const prepared = await this.renderer.prepareLevel(index);
    if (request !== this.levelStartRequest) return;
    this.ui.setMapLoading(false);
    if (prepared === 'failed') {
      this.ui.showToast(this.i18n.t('toast.mapLoadFailed'));
      return;
    }
    this.state.start(index, (col, row) => this.renderer.positionFor(col, row));
    this.waitingForFirstMove = this.state.currentLevel === 0 && !this.state.autoplay;
    this.waitingForBriefing = false;
    this.sendMode = this.state.level.features.half ? 'half' : 'all'; this.renderer.sendMode = this.sendMode;
    this.ui.startMission(this.state, this.progress); this.ui.setMode(this.sendMode, this.state); this.ui.syncPlayerSupply(this.state.playerSupplyEnabled); this.audio.play('confirm');
    this.resizeLayout();
    this.tutorial.start(this.state);
    this.guardianBriefing.start(this.state, !this.progress.guardianBriefingSeen);
    const relayMastery = this.state.level.id === 'signal-gardens';
    this.relayTutorial.start(
      this.state,
      relayMastery ? !this.progress.relayMasteryBriefingSeen : !this.progress.relayBriefingSeen,
      relayMastery ? this.progress.relayMasteryUsed : this.progress.relaySendUsed,
    );
    this.lastFrame = performance.now();
  }

  showMap(focus = this.state.currentLevel): void {
    this.levelStartRequest += 1;
    this.tutorial.stop(false);
    this.guardianBriefing.stop();
    this.relayTutorial.stop(false);
    this.state.running = false;
    this.waitingForFirstMove = false;
    this.waitingForBriefing = false;
    this.ui.setMapLoading(false);
    this.ui.showMap(this.progress, (index) => this.progressStore.isUnlocked(this.progress, index, DEBUG_UNLOCK), focus);
    this.resizeLayout();
  }

  setMode(mode: SendMode): void {
    const features = this.state.level.features;
    if ((mode === 'half' && !features.half) || (mode === 'all' && !features.all) || (mode === 'group' && !features.group)) return;
    this.sendMode = mode; this.renderer.sendMode = mode; this.ui.setMode(mode, this.state);
    this.audio.play('navigate');
    this.ui.showToast(this.i18n.t(mode === 'half' ? 'toast.mode.half' : mode === 'all' ? 'toast.mode.all' : 'toast.mode.group'));
  }

  private togglePlayerSupply(): void {
    const enabled = this.state.togglePlayerSupply();
    this.ui.syncPlayerSupply(enabled);
    this.audio.play('navigate');
    this.ui.showToast(this.i18n.t(enabled ? 'toast.supply.on' : 'toast.supply.off'));
  }

  private frame = (time: number): void => {
    const delta = Math.min(.05, (time - this.lastFrame) / 1000); this.lastFrame = time;
    if (this.state.running) {
      if (!this.simulationPaused()) this.state.update(delta * DEBUG_SPEED);
      this.renderer.effects.update(delta * DEBUG_SPEED); this.ui.updateHUD(this.state);
    }
    this.consumeEvents();
    this.renderer.draw(this.state, time); this.tutorial.updatePosition(); this.guardianBriefing.updatePosition(); this.relayTutorial.updatePosition(); this.animationFrame = requestAnimationFrame(this.frame);
  };

  private consumeEvents(): void {
    for (const event of this.state.drainEvents()) this.handleEvent(event);
  }

  private beginLevelOneBattle(): void {
    if (this.state.currentLevel === 0) this.waitingForFirstMove = false;
  }

  private simulationPaused(): boolean {
    return this.waitingForFirstMove || this.waitingForBriefing;
  }

  private handleEvent(event: GameEvent): void {
    if (event.type === 'send') this.renderer.effects.burst(event.detail.from, OWNER_COLORS[event.detail.owner].edge, 5);
    if (event.type === 'arrival' && event.detail.kind !== 'supply') this.audio.beep(145, .035, .02);
    if (event.type === 'capture') {
      this.renderer.effects.burst(event.detail.target, OWNER_COLORS[event.detail.newOwner].edge, 14);
      if (event.detail.newOwner === Owner.Player) this.audio.play('capture');
      else if (event.detail.oldOwner === Owner.Player) this.audio.play('loss');
      this.relayTutorial.capture(this.state, event.detail.target);
    }
    if (event.type === 'endgame') { this.ui.updateEndgame(this.state); this.ui.showToast(this.i18n.t(event.detail.stage === 1 ? 'toast.endgame.decline' : 'toast.endgame.decision')); }
    if (event.type === 'result') {
      this.tutorial.stop(false);
      this.guardianBriefing.stop();
      this.relayTutorial.stop(false);
      const firstHalfSendUnlock = event.detail.result === 'victory'
        && this.state.currentLevel === 0
        && !this.progress.completed[0];
      if (event.detail.result === 'victory') {
        this.progress = this.progressStore.complete(this.progress, this.state.currentLevel, this.state.elapsed);
        this.submitCampaignStatistics();
        this.audio.play('victory');
      } else this.audio.play('defeat');
      this.ui.showResult(this.state, this.progress, firstHalfSendUnlock);
    }
  }

  private toggleSound(): void { this.ui.syncSound(this.audio.toggle()); }

  private submitCampaignStatistics(): void {
    const completedMissions = this.progress.completed.filter(Boolean).length;
    this.kongregateStats.submit('missions_completed', completedMissions);
    if (completedMissions === LEVELS.length) this.kongregateStats.submit('campaign_complete', 1);
    const finalMission = LEVELS.length - 1;
    const finalBestSeconds = this.progress.completed[finalMission] ? this.progress.best[finalMission] : 0;
    if (finalBestSeconds > 0) this.kongregateStats.submit('final_mission_best_ms', Math.round(finalBestSeconds * 1000));
  }

  private async toggleFullscreen(): Promise<void> {
    this.audio.activate();
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { this.ui.showToast(this.i18n.t('toast.fullscreenFailed')); }
    this.ui.syncFullscreen(); this.scheduleResize();
  }

  private resetProgress(skipConfirmation = false): void {
    if (!skipConfirmation && !confirm(this.i18n.t('settings.resetConfirm'))) return;
    this.progress = this.progressStore.reset(); this.showMap(0);
  }

  private setLocale(locale: Locale): void {
    this.i18n.setLocale(locale);
    this.renderer.sendLabel = this.i18n.t('drag.send');
    this.renderer.shieldLabel = this.i18n.t('guardian.shield');
    this.ui.refreshLanguage(this.state, this.audio.enabled);
    this.tutorial.refreshCopy();
    this.guardianBriefing.refreshCopy();
    this.relayTutorial.refreshCopy();
  }

  private inputErrorKey(error: InputError): 'toast.invalid.decor' | 'toast.invalid.target' {
    return error === 'decor' ? 'toast.invalid.decor' : 'toast.invalid.target';
  }

  private bindWindowEvents(): void {
    window.addEventListener('resize', this.scheduleResize);
    window.addEventListener('orientationchange', () => window.setTimeout(this.scheduleResize, 120));
    document.addEventListener('fullscreenchange', this.scheduleResize);
    if (typeof ResizeObserver !== 'undefined') {
      this.stageResizeObserver = new ResizeObserver(this.scheduleResize);
      this.stageResizeObserver.observe(this.renderer.stage);
    }
    window.addEventListener('keydown', (event) => {
      if (event.key === '1') this.setMode('all'); if (event.key === '2') this.setMode('half'); if (event.key === '3') this.setMode('group');
      if (event.key.toLowerCase() === 'r') this.startLevel(); if (event.key === 'Escape') this.showMap();
    });
  }

  private resizeLayout = (): void => {
    const changed = this.renderer.resize();
    if (changed && this.ui.menu.classList.contains('show')) {
      this.ui.selectLevel(this.ui.selectedMenuLevel, this.progress, (index) => this.progressStore.isUnlocked(this.progress, index, DEBUG_UNLOCK), false);
    }
  };

  private scheduleResize = (): void => {
    cancelAnimationFrame(this.resizeFrame);
    this.resizeFrame = requestAnimationFrame(this.resizeLayout);
  };
}
