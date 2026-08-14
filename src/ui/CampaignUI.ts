import type { GameState } from '../core/GameState';
import { Owner, Terrain, type CampaignProgress, type SendMode, type VisualVariant } from '../core/types';
import type { TranslationKey } from '../i18n/catalog';
import type { I18n } from '../i18n/I18n';
import type { Locale } from '../i18n/types';
import { buildLevel } from '../levels/buildLevel';
import { CAMPAIGN_ACTS, campaignActForLevel, LEVELS } from '../levels';
import { createSeededRandom } from '../core/random';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { LandscapeRenderer } from '../rendering/LandscapeRenderer';
import { OWNER_COLORS } from '../rendering/palette';
import { CampaignAtlas } from './CampaignAtlas';

const required = <T extends Element = HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Required UI element #${id} is missing.`);
  return element as unknown as T;
};

export interface UICallbacks {
  startLevel(index?: number): void;
  showMap(focus?: number): void;
  setMode(mode: SendMode): void;
  toggleSound(): void;
  toggleFullscreen(): void;
  resetProgress(): void;
  setLocale(locale: Locale): void;
  activate(): void;
}

export class CampaignUI {
  readonly app = required('app'); readonly menu = required('campaignMenu'); readonly overlay = required('resultOverlay');
  readonly hint = required('hint'); readonly toast = required('toast');
  selectedMenuLevel = 0;
  private toastTimer = 0; private hintTimer = 0;
  private readonly previewLandscape: LandscapeRenderer;
  private readonly atlas: CampaignAtlas;

  constructor(private readonly callbacks: UICallbacks, private readonly i18n: I18n, visualVariant: VisualVariant = 'production') {
    this.previewLandscape = new LandscapeRenderer(() => this.renderPreview(this.selectedMenuLevel), visualVariant);
    this.atlas = new CampaignAtlas(required<SVGSVGElement>('campaignAtlasSvg'), i18n);
    required('playLevelBtn').addEventListener('click', () => callbacks.startLevel(this.selectedMenuLevel));
    for (const id of ['restartBtn', 'mobileRestartBtn', 'retryBtn']) required(id).addEventListener('click', () => callbacks.startLevel());
    for (const id of ['levelsBtn', 'mobileLevelsBtn', 'mapBtn']) required(id).addEventListener('click', () => callbacks.showMap());
    required('nextLevelBtn').addEventListener('click', () => callbacks.showMap(this.selectedMenuLevel + 1));
    for (const id of ['soundBtn', 'sideSoundBtn']) required(id).addEventListener('click', callbacks.toggleSound);
    for (const id of ['fullscreenBtn', 'menuFullscreenBtn', 'sideFullscreenBtn', 'mobileFullscreenBtn']) required(id).addEventListener('click', callbacks.toggleFullscreen);
    required('resetProgressBtn').addEventListener('click', callbacks.resetProgress);
    document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => button.addEventListener('click', () => callbacks.setLocale(button.dataset.locale as Locale)));
    document.querySelectorAll<HTMLButtonElement>('.modeBtn').forEach((button) => button.addEventListener('click', () => callbacks.setMode(button.dataset.mode as SendMode)));
    const settings = required('menuSettingsPanel');
    required('menuSettingsBtn').addEventListener('click', (event) => {
      event.stopPropagation(); const open = settings.classList.toggle('show'); settings.setAttribute('aria-hidden', String(!open));
    });
    document.addEventListener('pointerdown', (event) => {
      if (!settings.contains(event.target as Node) && event.target !== required('menuSettingsBtn')) {
        settings.classList.remove('show'); settings.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('pointerdown', callbacks.activate, { once: true });
    this.applyStaticTranslations(); this.syncLocaleControls();
  }

  private lastProgress: CampaignProgress = { completed: LEVELS.map(() => false), best: LEVELS.map(() => 0) };
  private lastUnlocked = (_index: number) => false;

  refreshLanguage(state: GameState, soundEnabled: boolean): void {
    document.documentElement.lang = this.i18n.locale;
    this.applyStaticTranslations(); this.syncLocaleControls(); this.syncSound(soundEnabled); this.syncFullscreen();
    if (this.menu.classList.contains('show')) {
      this.renderAtlas(this.selectedMenuLevel);
      this.selectLevel(this.selectedMenuLevel, this.lastProgress, this.lastUnlocked, false);
      return;
    }
    if (state.hexes.length) {
      this.applyMissionCopy(state); this.updateEndgame(state);
      if (this.overlay.classList.contains('show') && state.result) this.showResult(state, this.lastProgress);
    }
  }

  private applyStaticTranslations(): void {
    document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((element) => {
      element.textContent = this.i18n.t(element.dataset.i18n as TranslationKey);
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-aria-label]').forEach((element) => {
      element.setAttribute('aria-label', this.i18n.t(element.dataset.i18nAriaLabel as TranslationKey));
    });
    document.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((element) => {
      element.title = this.i18n.t(element.dataset.i18nTitle as TranslationKey);
    });
    document.querySelectorAll<HTMLMetaElement>('[data-i18n-content]').forEach((element) => {
      element.content = this.i18n.t(element.dataset.i18nContent as TranslationKey);
    });
  }

  private syncLocaleControls(): void {
    document.querySelectorAll<HTMLButtonElement>('[data-locale]').forEach((button) => {
      const locale = button.dataset.locale as Locale; const active = locale === this.i18n.locale;
      button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active));
      const key = locale === 'en' ? 'settings.english' : 'settings.german';
      button.setAttribute('aria-label', this.i18n.t(key)); button.title = this.i18n.t(key);
    });
  }

  private applyMissionCopy(state: GameState): void {
    required('missionName').textContent = this.i18n.text(state.level.name);
    required('missionText').textContent = this.i18n.text(state.level.objective);
    required('ruleText').textContent = this.i18n.text(state.level.rule);
    this.hint.textContent = state.currentLevel === 0 ? this.i18n.t('hint.levelOne') : this.i18n.text(state.level.rule);
  }

  startMission(state: GameState): void {
    this.selectedMenuLevel = state.currentLevel;
    this.menu.classList.remove('show'); this.overlay.classList.remove('show'); this.app.classList.remove('menuOpen', 'resultOpen'); document.body.classList.remove('campaignOpen');
    this.app.classList.toggle('introLevel', state.currentLevel === 0);
    required('legendHill').hidden = state.currentLevel < 3;
    required('legendRelay').hidden = !state.level.features.relay;
    this.applyMissionCopy(state);
    this.hint.style.opacity = '1'; clearTimeout(this.hintTimer);
    if (state.currentLevel !== 0) this.hintTimer = window.setTimeout(() => { this.hint.style.opacity = '0'; }, 3600);
    this.updateEndgame(state); this.updateHUD(state);
  }

  acknowledgeHint(): void {
    clearTimeout(this.hintTimer);
    this.hint.style.opacity = '0';
  }

  showMap(progress: CampaignProgress, unlocked: (index: number) => boolean, focus: number): void {
    this.lastProgress = progress; this.lastUnlocked = unlocked;
    this.overlay.classList.remove('show'); this.menu.classList.add('show'); this.app.classList.remove('resultOpen'); this.app.classList.add('menuOpen'); document.body.classList.add('campaignOpen');
    const done = progress.completed.filter(Boolean).length;
    required('progressCount').textContent = `${done} / ${LEVELS.length}`;
    (required('campaignProgressFill') as HTMLElement).style.width = `${done / LEVELS.length * 100}%`;
    this.renderAtlas(focus);
    this.selectLevel(Math.max(0, Math.min(LEVELS.length - 1, focus)), progress, unlocked, false);
  }

  selectLevel(index: number, progress: CampaignProgress, unlocked: (index: number) => boolean, reveal = true): void {
    this.selectedMenuLevel = Math.max(0, Math.min(LEVELS.length - 1, index));
    const level = LEVELS[this.selectedMenuLevel]; const actIndex = campaignActForLevel(this.selectedMenuLevel); const act = CAMPAIGN_ACTS[actIndex];
    if (this.atlas.needsLayoutUpdate()) this.renderAtlas(this.selectedMenuLevel);
    document.querySelectorAll<HTMLElement>('.mapNode').forEach((node) => node.classList.toggle('current', Number(node.dataset.level) === this.selectedMenuLevel));
    required('menuActLabel').textContent = `${this.i18n.text(act.roman)} · ${this.i18n.text(act.name)}`;
    required('menuLevelName').textContent = this.i18n.text(level.name);
    required('menuLevelText').textContent = this.i18n.text(level.blurb);
    required('menuLevelObjective').textContent = this.i18n.text(level.objective);
    required('menuLevelRule').textContent = this.i18n.text(level.rule);
    required('menuDifficulty').textContent = this.i18n.text(act.difficulty);
    required('menuPreviewLabel').textContent = this.i18n.t('campaign.preview', { level: String(this.selectedMenuLevel + 1).padStart(2, '0') });
    const done = progress.completed[this.selectedMenuLevel]; const available = unlocked(this.selectedMenuLevel); const state = required('menuLevelState');
    state.textContent = this.i18n.t(done ? 'campaign.state.completed' : available ? 'campaign.state.ready' : 'campaign.state.locked');
    state.classList.toggle('ready', available); state.classList.toggle('locked', !available);
    required('menuBestTime').textContent = done && progress.best[this.selectedMenuLevel]
      ? this.i18n.t('campaign.bestTime', { time:this.time(progress.best[this.selectedMenuLevel]) })
      : this.i18n.t(done ? 'campaign.state.completed' : 'campaign.notCompleted');
    required('menuLockHint').hidden = available; const play = required<HTMLButtonElement>('playLevelBtn'); play.disabled = !available;
    play.textContent = this.i18n.t(done ? 'campaign.play.again' : !available ? 'campaign.play.locked' : this.selectedMenuLevel === 0 && !progress.completed.some(Boolean) ? 'campaign.play.begin' : 'campaign.play.start');
    this.renderPreview(this.selectedMenuLevel);
    if (reveal && matchMedia('(max-width:900px) and (orientation:portrait)').matches) requestAnimationFrame(() => required('mapCenter').scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  private renderAtlas(selected: number): void {
    this.atlas.render(this.lastProgress, this.lastUnlocked, selected, (index) => this.selectLevel(index, this.lastProgress, this.lastUnlocked));
  }

  setMode(mode: SendMode, state: GameState): void {
    document.querySelectorAll<HTMLButtonElement>('.modeBtn').forEach((button) => {
      const candidate = button.dataset.mode as SendMode;
      const allowed = candidate === 'half' || (candidate === 'all' && state.level.features.all) || (candidate === 'group' && state.level.features.group);
      button.disabled = !allowed; button.classList.toggle('active', candidate === mode);
    });
  }

  updateHUD(state: GameState): void {
    const snapshot = state.snapshot();
    required('p1fields').textContent = String(snapshot.fields.p1); required('p2fields').textContent = String(snapshot.fields.p2);
    required('p1forces').textContent = String(snapshot.forces.p1); required('p2forces').textContent = String(snapshot.forces.p2);
    const balance = snapshot.fields.p1 - snapshot.fields.p2; required('frontBalance').textContent = balance > 0 ? `+${balance}` : String(balance);
    required('timeStatus').textContent = this.time(snapshot.elapsed); required('actionStatus').textContent = String(snapshot.actions); required('captureStatus').textContent = String(snapshot.captures);
  }

  updateEndgame(state: GameState): void {
    const label = this.i18n.t(state.endgameStage === 0 ? 'phase.growth' : state.endgameStage === 1 ? 'phase.decline' : 'phase.decision');
    required('headerLevel').textContent = this.i18n.t(state.endgameStage ? 'header.levelPhase' : 'header.level', {
      level: state.currentLevel + 1,
      name: this.i18n.text(state.level.short),
      phase: label,
    });
    required('phaseStatus').textContent = label;
  }

  showResult(state: GameState, progress: CampaignProgress = this.lastProgress): void {
    this.lastProgress = progress;
    const victory = state.result === 'victory';
    const finalLevel = state.currentLevel >= LEVELS.length - 1;
    required('verdict').textContent = this.i18n.t(state.result === 'victory' ? 'result.victory' : 'result.defeat');
    const reason = state.resultReason ? this.i18n.t(`result.reason.${state.resultReason}`) : '';
    required('verdictSub').textContent = reason;
    required('resultKicker').textContent = this.i18n.t(victory ? 'result.kicker.victory' : 'result.kicker.defeat');
    required('resultTime').textContent = this.time(state.elapsed);
    required('resultCaptures').textContent = String(state.captures);
    const best = progress.best[state.currentLevel];
    required('resultBest').textContent = best ? this.time(best) : '—';
    const advance = required('resultAdvance');
    advance.hidden = !victory;
    if (victory && finalLevel) {
      required('resultAdvanceLabel').textContent = this.i18n.t('result.campaignComplete');
      required('resultAdvanceName').textContent = 'HEXFRONT';
      required('resultAdvanceRule').textContent = this.i18n.t('result.campaignCompleteSub');
    } else if (victory) {
      const next = LEVELS[state.currentLevel + 1];
      required('resultAdvanceLabel').textContent = this.i18n.t('result.advance');
      required('resultAdvanceName').textContent = this.i18n.text(next.name);
      required('resultAdvanceRule').textContent = this.i18n.text(next.rule);
    }
    required<HTMLButtonElement>('nextLevelBtn').hidden = !victory || finalLevel;
    this.overlay.classList.toggle('victory', victory);
    this.overlay.classList.toggle('defeat', !victory);
    this.overlay.classList.add('show'); this.app.classList.add('resultOpen');
  }

  showToast(message: string): void {
    this.toast.textContent = message; this.toast.classList.add('show'); clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('show'), 1700);
  }

  syncSound(enabled: boolean): void { for (const id of ['soundBtn', 'sideSoundBtn']) required(id).textContent = this.i18n.t(enabled ? 'settings.soundOn' : 'settings.soundOff'); }

  syncFullscreen(): void {
    const active = Boolean(document.fullscreenElement);
    const label = this.i18n.t(active ? 'campaign.exitFullscreen' : 'campaign.fullscreen');
    for (const id of ['fullscreenBtn', 'mobileFullscreenBtn']) {
      const button = required(id); button.textContent = active ? '↙' : '⛶'; button.setAttribute('aria-label', label); button.title = label;
    }
    const side = required('sideFullscreenBtn'); side.textContent = this.i18n.t(active ? 'utility.windowShort' : 'utility.fullscreenShort');
    side.setAttribute('aria-label', this.i18n.t(active ? 'utility.exitFullscreenAria' : 'campaign.fullscreen'));
    const menu = required('menuFullscreenBtn');
    menu.textContent = this.i18n.t(active ? 'settings.exitFullscreen' : 'settings.fullscreen');
    menu.setAttribute('aria-label', this.i18n.t(active ? 'campaign.exitFullscreen' : 'campaign.fullscreen'));
  }

  private renderPreview(levelIndex: number): void {
    const canvas = required<HTMLCanvasElement>('levelPreview'); const bounds = canvas.getBoundingClientRect(); const width = Math.max(260, Math.round(bounds.width)); const height = Math.max(170, Math.round(bounds.height));
    const ratio = Math.min(devicePixelRatio || 1, 2); canvas.width = width * ratio; canvas.height = height * ratio;
    const context = canvas.getContext('2d'); if (!context) return; context.setTransform(ratio, 0, 0, ratio, 0, 0); context.fillStyle = '#d7e3cf'; context.fillRect(0, 0, width, height);
    const level = LEVELS[levelIndex]; const radius = Math.max(5, Math.min((width - 40) / ((level.cols + .5) * Math.sqrt(3)), (height - 32) / (level.rows * 1.5 + .5)));
    const horizontal = Math.sqrt(3) * radius; const originX = (width - (level.cols + .5) * horizontal) / 2 + horizontal / 2; const originY = (height - (level.rows * 1.5 * radius + .5 * radius)) / 2 + radius;
    const hexes = buildLevel(levelIndex, createSeededRandom(level.seed), (col, row) => ({ x: originX + col * horizontal + (row % 2 ? horizontal / 2 : 0), y: originY + row * 1.5 * radius }));
    for (const hex of hexes) {
      BoardRenderer.path(context, hex.x, hex.y, radius * .9);
      if (hex.terrain === Terrain.Decor) { this.previewLandscape.drawHex(context, hex, radius, level.landscapeStyle, level.seed, BoardRenderer.path); continue; }
      else { const colors = OWNER_COLORS[hex.owner]; context.fillStyle = hex.owner === Owner.Neutral ? '#eee9d5' : colors.high; context.fill(); context.strokeStyle = colors.edge; }
      context.lineWidth = hex.terrain === Terrain.Base ? 2 : .8; context.stroke();
    }
    this.previewLandscape.drawWaterShores(context, hexes, radius, level.landscapeStyle, BoardRenderer.path);
  }

  private time(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
}
