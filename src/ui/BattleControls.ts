import type { GameState } from '../core/GameState';
import { Owner, type HexState } from '../core/types';
import type { I18n } from '../i18n/I18n';
import type { BoardRenderer } from '../rendering/BoardRenderer';
import { storageUnavailable } from '../persistence/SafeStorage';
import { isGuardianCell } from '../systems/StructureSystem';

interface BattleCallbacks {
  supply(): void;
  pause(paused: boolean): void;
  restart(): void;
  map(): void;
  sound(): void;
  locale(): void;
}

export class BattleControls {
  private readonly bar = document.getElementById('battleBar')!;
  private readonly supply = document.getElementById('battleSupply') as HTMLButtonElement;
  private readonly hold = document.getElementById('holdField') as HTMLButtonElement;
  private readonly status = document.getElementById('battleStatus')!;
  private readonly selection = document.getElementById('fieldStatus')!;
  private readonly warning = document.getElementById('storageWarning')!;
  private readonly dialog = document.getElementById('pauseDialog') as HTMLDialogElement;
  private previousFocus: HTMLElement | null = null;

  constructor(private readonly state: GameState, private readonly renderer: BoardRenderer,
    private readonly i18n: I18n, private readonly callbacks: BattleCallbacks) {
    this.supply.addEventListener('click', callbacks.supply);
    this.hold.addEventListener('click', () => {
      if (renderer.selected) state.toggleHold(renderer.selected);
      this.update();
    });
    document.getElementById('pauseButton')!.addEventListener('click', () => callbacks.pause(true));
    document.getElementById('resumeButton')!.addEventListener('click', () => callbacks.pause(false));
    document.getElementById('pauseRestart')!.addEventListener('click', callbacks.restart);
    document.getElementById('pauseMap')!.addEventListener('click', callbacks.map);
    document.getElementById('pauseSound')!.addEventListener('click', callbacks.sound);
    document.getElementById('pauseLanguage')!.addEventListener('click', callbacks.locale);
    document.getElementById('pauseZoom')!.addEventListener('click', () => {
      renderer.zoom = renderer.zoom === 1 ? 1.7 : 1;
      renderer.resize();
      renderer.stage.scrollLeft = (renderer.width - renderer.stage.clientWidth) / 2;
      renderer.stage.scrollTop = (renderer.height - renderer.stage.clientHeight) / 2;
      this.update();
    });
    this.dialog.addEventListener('cancel', (event) => { event.preventDefault(); callbacks.pause(false); });
    this.update();
  }

  showPause(paused: boolean): void {
    if (paused && !this.dialog.open) {
      this.previousFocus = document.activeElement as HTMLElement | null;
      this.dialog.showModal();
      (document.getElementById('resumeButton') as HTMLButtonElement).focus();
    } else if (!paused && this.dialog.open) {
      this.dialog.close(); this.previousFocus?.focus();
    }
    this.update();
  }

  update(): void {
    const t = this.i18n.t.bind(this.i18n);
    this.bar.hidden = !this.state.running;
    this.warning.hidden = !storageUnavailable();
    this.warning.textContent = t('storage.warning');
    this.supply.textContent = t(this.state.playerSupplyEnabled ? 'battle.supply.on' : 'battle.supply.off');
    this.supply.setAttribute('aria-pressed', String(this.state.playerSupplyEnabled));
    this.supply.disabled = !this.state.level.features.supply;
    this.supply.title = t(this.state.playerSupplyEnabled ? 'supply.description.on' : 'supply.description.off');
    const seconds = Math.floor(this.state.elapsed);
    const stage = this.state.endgameStage;
    this.status.textContent = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')} · ${t(stage === 2 ? 'phase.decision' : stage === 1 ? 'phase.decline' : 'phase.growth')}`;
    const hex: HexState | null = this.renderer.selected;
    const owned = hex?.owner === Owner.Player && !isGuardianCell(this.state.structures, hex);
    this.hold.disabled = !owned || !this.state.level.features.supply;
    this.hold.setAttribute('aria-pressed', String(Boolean(owned && hex.supplyHeld)));
    this.hold.textContent = t(owned && hex.supplyHeld ? 'battle.hold.on' : 'battle.hold.off');
    this.hold.title = t('battle.hold.help');
    this.selection.textContent = hex ? `${hex.col + 1}/${hex.row + 1} · ${Math.floor(hex.units)}` : t('battle.select');
    const preview = document.getElementById('commandPreview')!;
    preview.hidden = !this.renderer.commandPreview;
    preview.textContent = this.renderer.commandPreview;
    const copy = {
      pauseButton: 'battle.pause', resumeButton: 'battle.resume', pauseRestart: 'battle.restart',
      pauseMap: 'battle.leave', pauseTitle: 'battle.paused', pauseHelp: 'battle.help',
      pauseSound: 'settings.sound', pauseLanguage: 'battle.language',
    } as const;
    for (const [id, key] of Object.entries(copy)) document.getElementById(id)!.textContent = t(key);
    document.getElementById('pauseZoom')!.textContent = t(this.renderer.zoom > 1 ? 'battle.zoom.fit' : 'battle.zoom.in');
  }
}
