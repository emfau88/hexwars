import { hexDistance } from '../core/hex';
import type { GameState } from '../core/GameState';
import { Owner, Terrain, type HexState } from '../core/types';
import type { I18n } from '../i18n/I18n';
import type { BoardRenderer } from '../rendering/BoardRenderer';

interface RelayTutorialCallbacks {
  onOpen(): void;
  onClose(introduction: boolean, levelId: string): void;
  onComplete(levelId: string): void;
  showHint(message: string): void;
  hideHint(): void;
  showSuccess(message: string): void;
}

interface RelayVisual {
  hex: HexState;
  marker: HTMLImageElement;
  arrow?: HTMLImageElement;
  arrowFrom?: HexState;
}

const TUTORIAL_ASSET_ROOT = './assets/tutorial/';
const RELAY_ASSET = './assets/structures/relay-neutral-v2.png';
const LEVEL_ID = 'relay-island';
const MASTERY_LEVEL_ID = 'signal-gardens';
const TARGETS = [[2, 4], [4, 4]] as const;
const MASTERY_TARGETS = new Map([
  ['1,6', [[1, 4]] as const],
  ['5,6', [[5, 4]] as const],
]);

export class RelayTutorial {
  private readonly root: HTMLDivElement;
  private readonly visualLayer: HTMLDivElement;
  private readonly card: HTMLElement;
  private readonly kicker: HTMLElement;
  private readonly title: HTMLElement;
  private readonly summary: HTMLElement;
  private readonly range: HTMLElement;
  private readonly captureRule: HTMLElement;
  private readonly previewRule: HTMLElement;
  private readonly fanoutRule: HTMLElement;
  private readonly button: HTMLButtonElement;
  private readonly helpButton: HTMLButtonElement;
  private readonly coach: HTMLDivElement;
  private state: GameState | null = null;
  private introduction = false;
  private complete = false;
  private readonly usedRelays = new Set<string>();
  private briefingVisuals: RelayVisual[] = [];
  private coachVisuals: RelayVisual[] = [];

  constructor(
    private readonly stage: HTMLElement,
    private readonly renderer: BoardRenderer,
    private readonly i18n: I18n,
    private readonly callbacks: RelayTutorialCallbacks,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'relayBriefing';
    this.root.className = 'relayBriefing';
    this.root.hidden = true;

    this.visualLayer = document.createElement('div');
    this.visualLayer.className = 'relayBriefingVisuals';
    this.root.append(this.visualLayer);

    this.card = document.createElement('section');
    this.card.className = 'relayBriefingCard';
    this.card.setAttribute('role', 'dialog');
    this.card.setAttribute('aria-modal', 'true');
    this.card.setAttribute('aria-labelledby', 'relayBriefingTitle');
    const relayEmblem = this.image('relayBriefingEmblem', RELAY_ASSET, '');
    this.kicker = document.createElement('p'); this.kicker.className = 'relayBriefingKicker';
    this.title = document.createElement('h2'); this.title.id = 'relayBriefingTitle';
    this.summary = document.createElement('p'); this.summary.className = 'relayBriefingSummary';
    this.range = document.createElement('strong'); this.range.className = 'relayBriefingRange';
    const rules = document.createElement('ul');
    this.captureRule = document.createElement('li');
    this.previewRule = document.createElement('li');
    this.fanoutRule = document.createElement('li');
    rules.append(this.captureRule, this.previewRule, this.fanoutRule);
    this.button = document.createElement('button');
    this.button.type = 'button'; this.button.className = 'primaryBtn relayBriefingConfirm';
    this.button.addEventListener('click', () => this.dismiss());
    this.card.append(relayEmblem, this.kicker, this.title, this.summary, this.range, rules, this.button);
    this.root.append(this.card);

    this.helpButton = document.createElement('button');
    this.helpButton.id = 'relayHelpBtn';
    this.helpButton.className = 'relayHelpBtn';
    this.helpButton.type = 'button';
    this.helpButton.hidden = true;
    this.helpButton.addEventListener('click', () => this.show(false));

    this.coach = document.createElement('div');
    this.coach.id = 'relayCoach';
    this.coach.className = 'relayCoach';
    this.coach.hidden = true;
    this.stage.append(this.root, this.coach, this.helpButton);
  }

  start(state: GameState, introduce: boolean, complete: boolean): void {
    this.stop(false);
    this.state = state;
    this.complete = complete;
    this.usedRelays.clear();
    const active = this.isRelayMission(state);
    this.root.dataset.mission = state.level.id === MASTERY_LEVEL_ID ? 'mastery' : 'introduction';
    this.coach.dataset.mission = this.root.dataset.mission;
    this.helpButton.hidden = !active;
    this.refreshCopy();
    if (!active) return;
    if (introduce) this.show(true);
    else this.syncCoach();
  }

  show(introduction: boolean): void {
    if (!this.state || !this.state.running || !this.isRelayMission(this.state)) return;
    this.clearVisuals(this.briefingVisuals);
    const relays = this.relays();
    if (!relays.length) return;
    for (const relay of relays) {
      this.briefingVisuals.push(this.createVisual(relay, true, true));
      for (const target of this.targetsFor(relay)) this.briefingVisuals.push(this.createVisual(target, false, true, relay));
    }
    this.introduction = introduction;
    this.root.hidden = false;
    this.root.classList.add('show');
    this.coach.hidden = true;
    this.helpButton.hidden = true;
    this.refreshCopy();
    this.updatePosition();
    this.callbacks.onOpen();
    window.setTimeout(() => this.button.focus(), 0);
  }

  dismiss(): void {
    if (this.root.hidden) return;
    const introduction = this.introduction;
    this.clearVisuals(this.briefingVisuals);
    this.root.classList.remove('show');
    this.root.hidden = true;
    const levelId = this.state?.level.id ?? LEVEL_ID;
    this.helpButton.hidden = !this.isRelayMission(this.state);
    this.callbacks.onClose(introduction, levelId);
    this.syncCoach();
  }

  capture(state: GameState, target: HexState): void {
    if (state !== this.state || this.complete || target.terrain !== Terrain.Relay || target.owner !== Owner.Player) return;
    this.syncCoach();
  }

  gestureStart(state: GameState, source: HexState): void {
    if (!this.isCoaching(state) || !this.relays().includes(source) || source.owner !== Owner.Player) return;
    if (this.isMastery() && this.usedRelays.has(this.key(source))) {
      this.callbacks.showHint(this.i18n.t('relayMastery.useOther'));
      return;
    }
    this.coach.dataset.phase = 'drag';
    this.callbacks.showHint(this.i18n.t(this.isMastery() ? 'relayMastery.drag' : 'relayCoach.drag'));
  }

  gestureMove(state: GameState, source: HexState, target: HexState | null): void {
    if (!this.isCoaching(state) || !this.relays().includes(source) || source.owner !== Owner.Player) return;
    if (this.isMastery() && this.usedRelays.has(this.key(source))) {
      this.callbacks.showHint(this.i18n.t('relayMastery.useOther'));
      return;
    }
    const validRangeTwo = Boolean(target && target !== source && hexDistance(source, target) === 2 && state.canSend(source, target));
    this.coach.dataset.phase = validRangeTwo ? 'release' : 'drag';
    this.callbacks.showHint(this.i18n.t(this.isMastery()
      ? validRangeTwo ? 'relayMastery.release' : 'relayMastery.drag'
      : validRangeTwo ? 'relayCoach.release' : 'relayCoach.drag'));
  }

  gestureEnd(state: GameState, sent: number, source: HexState | null, target: HexState | null): void {
    if (!this.isCoaching(state)) return;
    if (sent > 0 && source?.terrain === Terrain.Relay && target && hexDistance(source, target) === 2) {
      if (this.isMastery()) {
        this.usedRelays.add(this.key(source));
        if (this.usedRelays.size < this.relays().length) {
          this.callbacks.showSuccess(this.i18n.t('relayMastery.firstSuccess'));
          this.syncCoach();
          return;
        }
      }
      this.complete = true;
      this.clearCoach();
      this.callbacks.hideHint();
      this.callbacks.showSuccess(this.i18n.t(this.isMastery() ? 'relayMastery.success' : 'relayCoach.success'));
      this.callbacks.onComplete(this.state?.level.id ?? LEVEL_ID);
      return;
    }
    this.coach.dataset.phase = 'ready';
    this.refreshHint();
  }

  stop(hideHint = true): void {
    this.clearVisuals(this.briefingVisuals);
    this.clearCoach();
    this.root.classList.remove('show');
    this.root.hidden = true;
    this.helpButton.hidden = true;
    this.state = null;
    if (hideHint) this.callbacks.hideHint();
  }

  refreshCopy(): void {
    const prefix = this.isMastery() ? 'relayMastery' : 'relayBriefing';
    this.kicker.textContent = this.i18n.t(`${prefix}.kicker` as 'relayBriefing.kicker');
    this.title.textContent = this.i18n.t(`${prefix}.title` as 'relayBriefing.title');
    this.summary.textContent = this.i18n.t(`${prefix}.summary` as 'relayBriefing.summary');
    this.range.textContent = this.i18n.t(`${prefix}.range` as 'relayBriefing.range');
    this.captureRule.textContent = this.i18n.t(`${prefix}.capture` as 'relayBriefing.capture');
    this.previewRule.textContent = this.i18n.t(`${prefix}.preview` as 'relayBriefing.preview');
    this.fanoutRule.textContent = this.i18n.t(`${prefix}.fanout` as 'relayBriefing.fanout');
    this.button.textContent = this.i18n.t(this.introduction ? 'relayBriefing.start' : 'relayBriefing.resume');
    this.helpButton.textContent = this.i18n.t('relayBriefing.help');
    this.helpButton.setAttribute('aria-label', this.i18n.t('relayBriefing.helpAria'));
    this.helpButton.title = this.i18n.t('relayBriefing.helpAria');
    if (!this.root.hidden || this.isCoaching(this.state)) this.refreshHint();
  }

  updatePosition(): void {
    const radius = this.renderer.geometrySnapshot().runtime.radius;
    for (const visual of [...this.briefingVisuals, ...this.coachVisuals]) {
      const point = this.renderer.screenPositionFor(visual.hex);
      visual.marker.style.left = `${point.x}px`; visual.marker.style.top = `${point.y}px`;
      visual.marker.style.width = `${Math.max(54, radius * (visual.hex.terrain === Terrain.Relay ? 2.25 : 2.05))}px`;
      visual.marker.style.height = visual.marker.style.width;
      if (visual.arrow && visual.arrowFrom) {
        const source = this.renderer.screenPositionFor(visual.arrowFrom);
        const deltaX = point.x - source.x;
        const deltaY = point.y - source.y;
        const distance = Math.hypot(deltaX, deltaY);
        visual.arrow.style.left = `${source.x + deltaX * .5}px`;
        visual.arrow.style.top = `${source.y + deltaY * .5}px`;
        visual.arrow.style.width = `${Math.max(27, radius * .95)}px`;
        visual.arrow.style.height = `${Math.max(54, distance * .58)}px`;
        visual.arrow.style.transform = `translate(-50%,-50%) rotate(${Math.atan2(deltaY, deltaX) * 180 / Math.PI + 90}deg)`;
      }
    }
  }

  private syncCoach(): void {
    if (!this.state || !this.isRelayMission(this.state) || this.complete || !this.root.hidden) {
      this.clearCoach();
      return;
    }
    this.clearCoach();
    const relays = this.relays();
    if (!relays.length) return;
    for (const relay of relays) {
      if (this.isMastery() && this.usedRelays.has(this.key(relay))) continue;
      this.coachVisuals.push(this.createVisual(relay, true, false));
      if (relay.owner === Owner.Player) {
        for (const target of this.targetsFor(relay)) this.coachVisuals.push(this.createVisual(target, false, false, relay));
      }
    }
    this.coach.dataset.phase = 'ready';
    this.coach.hidden = false;
    this.updatePosition();
    this.refreshHint();
  }

  private refreshHint(): void {
    if (!this.isCoaching(this.state) || !this.state) return;
    const relays = this.relays();
    if (this.isMastery()) {
      if (this.usedRelays.size > 0) {
        const remaining = relays.filter((relay) => !this.usedRelays.has(this.key(relay)));
        this.callbacks.showHint(this.i18n.t(remaining.every(({ owner }) => owner === Owner.Player)
          ? 'relayMastery.useOther' : 'relayMastery.captureOther'));
      } else {
        const captured = relays.filter(({ owner }) => owner === Owner.Player).length;
        this.callbacks.showHint(this.i18n.t(captured === 0 ? 'relayMastery.captureBoth'
          : captured < relays.length ? 'relayMastery.captureOther' : 'relayMastery.hold'));
      }
      return;
    }
    const relay = relays[0];
    this.callbacks.showHint(this.i18n.t(!relay || relay.owner !== Owner.Player ? 'relayCoach.capture' : 'relayCoach.hold'));
  }

  private isCoaching(state: GameState | null): boolean {
    return Boolean(state && state === this.state && this.isRelayMission(state) && !this.complete && this.root.hidden);
  }

  private relays(): HexState[] {
    return this.state?.hexes.filter((hex) => hex.terrain === Terrain.Relay) ?? [];
  }

  private targetsFor(relay: HexState): HexState[] {
    const targets = this.isMastery() ? MASTERY_TARGETS.get(this.key(relay)) ?? [] : TARGETS;
    return targets.flatMap(([col, row]) => {
      const hex = this.state?.hexAt(col, row);
      return hex ? [hex] : [];
    });
  }

  private isRelayMission(state: GameState | null): boolean {
    return Boolean(state && (state.level.id === LEVEL_ID || state.level.id === MASTERY_LEVEL_ID));
  }

  private isMastery(): boolean {
    return this.state?.level.id === MASTERY_LEVEL_ID;
  }

  private key(hex: HexState): string {
    return `${hex.col},${hex.row}`;
  }

  private createVisual(hex: HexState, relay: boolean, briefing: boolean, arrowFrom?: HexState): RelayVisual {
    const marker = this.image(
      `${briefing ? 'relayBriefing' : 'relayCoach'}${relay ? 'Relay' : 'Target'}`,
      relay ? RELAY_ASSET : `${TUTORIAL_ASSET_ROOT}tutorial-target-marker-v1.webp`,
      '',
    );
    const parent = briefing ? this.visualLayer : this.coach;
    if (relay) { parent.append(marker); return { hex, marker }; }
    const arrow = this.image(
      `${briefing ? 'relayBriefing' : 'relayCoach'}Arrow`,
      `${TUTORIAL_ASSET_ROOT}tutorial-command-arrow-v1.webp`,
      '',
    );
    parent.append(marker, arrow);
    return { hex, marker, arrow, arrowFrom };
  }

  private image(className: string, src: string, alt: string): HTMLImageElement {
    const image = document.createElement('img');
    image.className = className; image.src = src; image.alt = alt; image.draggable = false;
    return image;
  }

  private clearCoach(): void {
    this.clearVisuals(this.coachVisuals);
    this.coach.hidden = true;
    delete this.coach.dataset.phase;
  }

  private clearVisuals(visuals: RelayVisual[]): void {
    for (const { marker, arrow } of visuals) { marker.remove(); arrow?.remove(); }
    visuals.length = 0;
  }
}
