import type { GameState } from '../core/GameState';
import { Owner, Terrain, type CampaignProgress, type SendMode } from '../core/types';
import { buildLevel } from '../levels/buildLevel';
import { CAMPAIGN_ACTS, campaignActForLevel, LEVEL_ICONS, LEVELS } from '../levels';
import { createSeededRandom } from '../core/random';
import { BoardRenderer } from '../rendering/BoardRenderer';
import { OWNER_COLORS } from '../rendering/palette';

const required = <T extends HTMLElement>(id: string): T => {
  const element = document.getElementById(id);
  if (!element) throw new Error(`Required UI element #${id} is missing.`);
  return element as T;
};

export interface UICallbacks {
  startLevel(index?: number): void;
  showMap(focus?: number): void;
  setMode(mode: SendMode): void;
  toggleSound(): void;
  toggleFullscreen(): void;
  resetProgress(): void;
  activate(): void;
}

export class CampaignUI {
  readonly app = required('app'); readonly menu = required('campaignMenu'); readonly overlay = required('resultOverlay');
  readonly hint = required('hint'); readonly toast = required('toast');
  selectedMenuLevel = 0;
  private toastTimer = 0; private hintTimer = 0;

  constructor(private readonly callbacks: UICallbacks) {
    required('playLevelBtn').addEventListener('click', () => callbacks.startLevel(this.selectedMenuLevel));
    for (const id of ['restartBtn', 'mobileRestartBtn', 'retryBtn']) required(id).addEventListener('click', () => callbacks.startLevel());
    for (const id of ['levelsBtn', 'mobileLevelsBtn', 'mapBtn']) required(id).addEventListener('click', () => callbacks.showMap());
    required('nextLevelBtn').addEventListener('click', () => callbacks.startLevel(this.selectedMenuLevel + 1));
    for (const id of ['soundBtn', 'sideSoundBtn']) required(id).addEventListener('click', callbacks.toggleSound);
    for (const id of ['fullscreenBtn', 'sideFullscreenBtn', 'mobileFullscreenBtn']) required(id).addEventListener('click', callbacks.toggleFullscreen);
    required('resetProgressBtn').addEventListener('click', callbacks.resetProgress);
    document.querySelectorAll<HTMLButtonElement>('.modeBtn').forEach((button) => button.addEventListener('click', () => callbacks.setMode(button.dataset.mode as SendMode)));
    document.querySelectorAll<HTMLButtonElement>('.actTab').forEach((button, index) => button.addEventListener('click', () => this.selectLevel(CAMPAIGN_ACTS[index].range[0], this.lastProgress, this.lastUnlocked)));
    document.addEventListener('pointerdown', callbacks.activate, { once: true });
  }

  private lastProgress: CampaignProgress = { completed: LEVELS.map(() => false), best: LEVELS.map(() => 0) };
  private lastUnlocked = (_index: number) => false;

  startMission(state: GameState): void {
    this.selectedMenuLevel = state.currentLevel;
    this.menu.classList.remove('show'); this.overlay.classList.remove('show'); this.app.classList.remove('menuOpen'); document.body.classList.remove('campaignOpen');
    required('missionName').textContent = state.level.name; required('missionText').textContent = state.level.objective; required('ruleText').textContent = state.level.rule;
    this.hint.textContent = state.currentLevel === 0 ? 'Zahl = spielbar · Orange wählen und zu einem Nachbarfeld ziehen.' : state.level.rule;
    this.hint.style.opacity = '1'; clearTimeout(this.hintTimer); this.hintTimer = window.setTimeout(() => { this.hint.style.opacity = '0'; }, 3600);
    this.updateEndgame(state); this.updateHUD(state);
  }

  showMap(progress: CampaignProgress, unlocked: (index: number) => boolean, focus: number): void {
    this.lastProgress = progress; this.lastUnlocked = unlocked;
    this.overlay.classList.remove('show'); this.menu.classList.add('show'); this.app.classList.add('menuOpen'); document.body.classList.add('campaignOpen');
    const nodes = required('mapNodes'); nodes.innerHTML = '';
    const done = progress.completed.filter(Boolean).length;
    required('progressCount').textContent = `${done} / ${LEVELS.length}`;
    (required('campaignProgressFill') as HTMLElement).style.width = `${done / LEVELS.length * 100}%`;
    required('campaignFocusLabel').textContent = `LEVEL ${Math.min(LEVELS.length, focus + 1)}`;
    CAMPAIGN_ACTS.forEach((act, actIndex) => {
      const group = document.createElement('section'); group.className = 'actGroup'; group.dataset.act = String(actIndex);
      group.innerHTML = `<div class="actGroupHeader"><span>${act.roman} · ${act.name}</span></div>`;
      const list = document.createElement('div'); list.className = 'actLevels';
      for (let index = act.range[0]; index <= act.range[1]; index += 1) {
        const button = document.createElement('button'); button.type = 'button'; button.className = `mapNode ${unlocked(index) ? 'unlocked' : 'locked'}${progress.completed[index] ? ' completed' : ''}`;
        button.setAttribute('aria-label', `Level ${index + 1}: ${LEVELS[index].short}${unlocked(index) ? '' : ' – gesperrt'}`);
        button.innerHTML = `<span class="nodeIcon" aria-hidden="true">${LEVEL_ICONS[index]}</span><span class="nodeCopy"><small>LEVEL ${String(index + 1).padStart(2, '0')}</small><strong>${LEVELS[index].short}</strong></span><span class="nodeState" aria-hidden="true">${progress.completed[index] ? '✓' : unlocked(index) ? '→' : '·'}</span>`;
        button.addEventListener('click', () => this.selectLevel(index, progress, unlocked)); list.appendChild(button);
      }
      group.appendChild(list); nodes.appendChild(group);
    });
    this.selectLevel(Math.max(0, Math.min(LEVELS.length - 1, focus)), progress, unlocked);
  }

  selectLevel(index: number, progress: CampaignProgress, unlocked: (index: number) => boolean): void {
    this.selectedMenuLevel = Math.max(0, Math.min(LEVELS.length - 1, index));
    const level = LEVELS[this.selectedMenuLevel]; const actIndex = campaignActForLevel(this.selectedMenuLevel); const act = CAMPAIGN_ACTS[actIndex];
    document.querySelectorAll('.mapNode').forEach((node, nodeIndex) => node.classList.toggle('current', nodeIndex === this.selectedMenuLevel));
    document.querySelectorAll('.actTab').forEach((node, nodeIndex) => node.classList.toggle('current', nodeIndex === actIndex));
    document.querySelectorAll('.actGroup').forEach((node, nodeIndex) => node.classList.toggle('current', nodeIndex === actIndex));
    required('menuActLabel').textContent = `${act.roman} · ${act.name}`; required('menuLevelName').textContent = level.name;
    required('menuLevelText').textContent = level.blurb; required('menuLevelObjective').textContent = level.objective; required('menuLevelRule').textContent = level.rule;
    required('menuDifficulty').textContent = act.difficulty; required('menuPreviewLabel').textContent = `LEVEL ${String(this.selectedMenuLevel + 1).padStart(2, '0')} · KARTENVORSCHAU`;
    const done = progress.completed[this.selectedMenuLevel]; const available = unlocked(this.selectedMenuLevel); const state = required('menuLevelState');
    state.textContent = done ? 'GESCHAFFT' : available ? 'BEREIT' : 'GESPERRT'; state.classList.toggle('ready', available); state.classList.toggle('locked', !available);
    required('menuBestTime').textContent = done && progress.best[this.selectedMenuLevel] ? `BESTZEIT ${this.time(progress.best[this.selectedMenuLevel])}` : done ? 'GESCHAFFT' : 'NOCH NICHT GESCHAFFT';
    required('menuLockHint').hidden = available; const play = required<HTMLButtonElement>('playLevelBtn'); play.disabled = !available;
    play.textContent = done ? 'NOCH EINMAL SPIELEN' : !available ? 'VORHERIGES LEVEL ABSCHLIESSEN' : this.selectedMenuLevel === 0 && !progress.completed.some(Boolean) ? 'KAMPAGNE BEGINNEN' : 'LEVEL STARTEN';
    this.renderPreview(this.selectedMenuLevel);
    if (matchMedia('(max-width:900px) and (orientation:portrait)').matches) requestAnimationFrame(() => required('mapCenter').scrollIntoView({ behavior: 'smooth', block: 'start' }));
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
    const label = state.endgameStage === 0 ? 'WACHSTUM' : state.endgameStage === 1 ? 'AUSKLANG' : 'ENTSCHEIDUNG';
    required('headerLevel').textContent = `LEVEL ${state.currentLevel + 1} · ${state.level.short}${state.endgameStage ? ` · ${label}` : ''}`; required('phaseStatus').textContent = label;
  }

  showResult(state: GameState): void {
    required('verdict').textContent = state.result === 'victory' ? 'SIEG' : 'NIEDERLAGE';
    required('verdictSub').textContent = `${state.resultReason} · ${this.time(state.elapsed)} · ${state.actions} Aktionen · ${state.captures} Eroberungen`;
    required<HTMLButtonElement>('nextLevelBtn').hidden = state.result !== 'victory' || state.currentLevel >= LEVELS.length - 1;
    this.overlay.classList.add('show');
  }

  showToast(message: string): void {
    this.toast.textContent = message; this.toast.classList.add('show'); clearTimeout(this.toastTimer);
    this.toastTimer = window.setTimeout(() => this.toast.classList.remove('show'), 1700);
  }

  syncSound(enabled: boolean): void { for (const id of ['soundBtn', 'sideSoundBtn']) required(id).textContent = enabled ? 'TON AN' : 'TON AUS'; }

  syncFullscreen(): void {
    const active = Boolean(document.fullscreenElement);
    required('fullscreenBtn').textContent = active ? '↙' : '⛶'; required('sideFullscreenBtn').textContent = active ? 'FEN' : 'VOLL'; required('mobileFullscreenBtn').textContent = active ? '↙' : '⛶';
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
      if (hex.terrain === Terrain.Decor) { const fill = hex.decor === 'water' ? '#91ccdc' : hex.decor === 'forest' ? '#a8c88e' : hex.decor === 'mountain' ? '#c9c4b5' : '#cedeaf'; context.fillStyle = fill; context.globalAlpha = .72; context.fill(); context.globalAlpha = 1; context.strokeStyle = '#92a583'; }
      else { const colors = OWNER_COLORS[hex.owner]; context.fillStyle = hex.owner === Owner.Neutral ? '#eee9d5' : colors.high; context.fill(); context.strokeStyle = colors.edge; }
      context.lineWidth = hex.terrain === Terrain.Base ? 2 : .8; context.stroke();
    }
  }

  private time(seconds: number): string { return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`; }
}
