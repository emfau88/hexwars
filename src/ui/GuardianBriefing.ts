import type { GameState } from '../core/GameState';
import type { HexState, StructureState } from '../core/types';
import type { I18n } from '../i18n/I18n';
import type { BoardRenderer } from '../rendering/BoardRenderer';

interface GuardianBriefingCallbacks {
  onOpen(): void;
  onClose(introduction: boolean): void;
}

const ASSET_ROOT = './assets/tutorial/';

export class GuardianBriefing {
  private readonly root: HTMLDivElement;
  private readonly card: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly title: HTMLElement;
  private readonly summary: HTMLElement;
  private readonly shield: HTMLElement;
  private readonly captureRule: HTMLElement;
  private readonly supplyRule: HTMLElement;
  private readonly directRule: HTMLElement;
  private readonly button: HTMLButtonElement;
  private readonly helpButton: HTMLButtonElement;
  private state: GameState | null = null;
  private introduction = false;
  private guardians: Array<{ structure: StructureState; hex: HexState; marker: HTMLImageElement; arrow: HTMLImageElement }> = [];

  constructor(
    private readonly stage: HTMLElement,
    private readonly renderer: BoardRenderer,
    private readonly i18n: I18n,
    private readonly callbacks: GuardianBriefingCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'guardianBriefing';
    this.root.className = 'guardianBriefing';
    this.root.hidden = true;

    const visualLayer = document.createElement('div');
    visualLayer.className = 'guardianBriefingVisuals';
    this.root.append(visualLayer);

    this.card = document.createElement('section');
    this.card.className = 'guardianBriefingCard';
    this.card.setAttribute('role', 'dialog');
    this.card.setAttribute('aria-modal', 'true');
    this.card.setAttribute('aria-labelledby', 'guardianBriefingTitle');
    this.kicker = document.createElement('p'); this.kicker.className = 'guardianBriefingKicker';
    this.title = document.createElement('h2'); this.title.id = 'guardianBriefingTitle';
    this.summary = document.createElement('p'); this.summary.className = 'guardianBriefingSummary';
    this.shield = document.createElement('strong'); this.shield.className = 'guardianBriefingShield';
    const rules = document.createElement('ul');
    this.captureRule = document.createElement('li');
    this.supplyRule = document.createElement('li');
    this.directRule = document.createElement('li');
    rules.append(this.captureRule, this.supplyRule, this.directRule);
    this.button = document.createElement('button');
    this.button.type = 'button'; this.button.className = 'primaryBtn guardianBriefingConfirm';
    this.button.addEventListener('click', () => this.dismiss());
    this.card.append(this.kicker, this.title, this.summary, this.shield, rules, this.button);
    this.root.append(this.card);

    this.helpButton = document.createElement('button');
    this.helpButton.id = 'guardianHelpBtn';
    this.helpButton.className = 'guardianHelpBtn';
    this.helpButton.type = 'button';
    this.helpButton.hidden = true;
    this.helpButton.addEventListener('click', () => this.show(false));
    this.stage.append(this.root, this.helpButton);
  }

  start(state: GameState, introduce: boolean): void {
    this.stop();
    this.state = state;
    const guardians = state.structures.filter(({ type }) => type === 'guardian');
    this.helpButton.hidden = guardians.length === 0;
    this.refreshCopy();
    if (guardians.length && introduce) this.show(true);
  }

  show(introduction: boolean): void {
    if (!this.state || !this.state.running) return;
    const structures = this.state.structures.filter(({ type }) => type === 'guardian');
    const entries = structures.flatMap((structure) => {
      const hex = this.state?.hexAt(structure.col, structure.row);
      if (!hex) return [];
      const marker = this.image('guardianBriefingMarker', '');
      const arrow = this.image('guardianBriefingArrow', '');
      this.root.querySelector('.guardianBriefingVisuals')?.append(marker, arrow);
      return [{ structure, hex, marker, arrow }];
    });
    if (!entries.length) return;
    this.guardians = entries;
    this.introduction = introduction;
    this.root.hidden = false;
    this.root.classList.add('show');
    this.helpButton.hidden = true;
    this.refreshCopy();
    this.updatePosition();
    this.callbacks.onOpen();
    window.setTimeout(() => this.button.focus(), 0);
  }

  dismiss(): void {
    if (this.root.hidden) return;
    const introduction = this.introduction;
    this.clearVisuals();
    this.root.classList.remove('show');
    this.root.hidden = true;
    this.helpButton.hidden = !this.state?.structures.some(({ type }) => type === 'guardian');
    this.callbacks.onClose(introduction);
  }

  stop(): void {
    this.clearVisuals();
    this.root.classList.remove('show');
    this.root.hidden = true;
    this.helpButton.hidden = true;
    this.state = null;
  }

  refreshCopy(): void {
    const guardians = this.state?.structures.filter(({ type }) => type === 'guardian') ?? [];
    const totalShield = guardians.reduce((sum, guardian) => sum + guardian.shield, 0);
    this.kicker.textContent = this.i18n.t('guardianBriefing.kicker');
    this.title.textContent = this.i18n.t('guardianBriefing.title');
    this.summary.textContent = this.i18n.t('guardianBriefing.summary');
    this.shield.textContent = this.i18n.t('guardianBriefing.shield', { count: guardians.length, shield: totalShield });
    this.captureRule.textContent = this.i18n.t('guardianBriefing.capture');
    this.supplyRule.textContent = this.i18n.t('guardianBriefing.supply');
    this.directRule.textContent = this.i18n.t('guardianBriefing.direct');
    this.button.textContent = this.i18n.t(this.introduction ? 'guardianBriefing.start' : 'guardianBriefing.resume');
    this.helpButton.textContent = this.i18n.t('guardianBriefing.help');
    this.helpButton.setAttribute('aria-label', this.i18n.t('guardianBriefing.helpAria'));
    this.helpButton.title = this.i18n.t('guardianBriefing.helpAria');
  }

  updatePosition(): void {
    if (this.root.hidden) return;
    const radius = this.renderer.geometrySnapshot().runtime.radius;
    for (const { hex, marker, arrow } of this.guardians) {
      const point = this.renderer.screenPositionFor(hex);
      marker.style.left = `${point.x}px`; marker.style.top = `${point.y}px`;
      marker.style.width = `${Math.max(58, radius * 2.45)}px`; marker.style.height = marker.style.width;
      arrow.style.left = `${point.x}px`; arrow.style.top = `${point.y - radius * .72}px`;
      arrow.style.width = `${Math.max(28, radius * 1.05)}px`; arrow.style.height = `${Math.max(58, radius * 2.15)}px`;
    }
  }

  private image(className: string, alt: string): HTMLImageElement {
    const image = document.createElement('img');
    image.className = className; image.alt = alt; image.draggable = false;
    image.src = `${ASSET_ROOT}${className === 'guardianBriefingMarker' ? 'tutorial-target-marker-v1.webp' : 'tutorial-command-arrow-v1.webp'}`;
    return image;
  }

  private clearVisuals(): void {
    for (const { marker, arrow } of this.guardians) { marker.remove(); arrow.remove(); }
    this.guardians = [];
  }
}
