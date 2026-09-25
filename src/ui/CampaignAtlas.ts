import type { CampaignProgress } from '../core/types';
import type { I18n } from '../i18n/I18n';
import { LEVELS } from '../levels';

const SVG_NS = 'http://www.w3.org/2000/svg';
const HTML_NS = 'http://www.w3.org/1999/xhtml';
const ATLAS_ASPECT = 1468 / 1096;
export const RELEASED_CAMPAIGN_LEVELS = 9;

type AtlasPoint = { x: number; y: number };
type AtlasStation = AtlasPoint & { levelIndex: number };
type AtlasLayout = {
  width: number;
  height: number;
  size: number;
  stations: AtlasStation[];
};

const STATION_POSITIONS: readonly AtlasPoint[] = [
  { x:.16, y:.20 }, { x:.39, y:.20 }, { x:.62, y:.22 },
  { x:.24, y:.42 }, { x:.47, y:.45 }, { x:.70, y:.42 },
  { x:.16, y:.72 }, { x:.39, y:.72 }, { x:.62, y:.72 }, { x:.80, y:.80 },
];

const svgNode = <K extends keyof SVGElementTagNameMap>(name: K, attributes: Record<string, string | number> = {}): SVGElementTagNameMap[K] => {
  const element = document.createElementNS(SVG_NS, name);
  for (const [attribute, value] of Object.entries(attributes)) element.setAttribute(attribute, String(value));
  return element;
};

function coverPoint(width: number, height: number, point: AtlasPoint): AtlasPoint {
  const viewportAspect = width / height;
  if (viewportAspect < ATLAS_ASPECT) {
    const visibleWidth = viewportAspect / ATLAS_ASPECT;
    return { x:width * (point.x - (1 - visibleWidth) / 2) / visibleWidth, y:height * point.y };
  }
  const visibleHeight = ATLAS_ASPECT / viewportAspect;
  return { x:width * point.x, y:height * (point.y - (1 - visibleHeight) / 2) / visibleHeight };
}

function layoutForMobile(mobile: boolean): AtlasLayout {
  const width = mobile ? 390 : 760; const height = mobile ? 250 : 650;
  return {
    width, height, size:mobile ? 31 : 39,
    stations:STATION_POSITIONS.map((point, levelIndex) => ({ ...coverPoint(width, height, point), levelIndex })),
  };
}

export class CampaignAtlas {
  private mobile: boolean | null = null;
  private readonly backdrop = svgNode('image', { class:'atlasBackdrop' });
  private readonly body: HTMLElement | null;
  private backdropStarted = false;

  constructor(private readonly svg: SVGSVGElement, private readonly i18n: I18n) {
    this.body = svg.parentElement;
    this.body?.classList.add('atlasLoading');
    this.backdrop.addEventListener('load', () => this.finishBackdrop(true), { once:true });
    this.backdrop.addEventListener('error', () => this.finishBackdrop(false), { once:true });
  }

  needsLayoutUpdate(): boolean {
    return this.mobile !== matchMedia('(max-width:900px), (max-height:620px)').matches;
  }

  render(progress: CampaignProgress, unlocked: (index: number) => boolean, selected: number, onSelect: (index: number) => void): void {
    this.mobile = matchMedia('(max-width:900px), (max-height:620px)').matches;
    const layout = layoutForMobile(this.mobile);
    this.svg.replaceChildren();
    this.svg.setAttribute('viewBox', `0 0 ${layout.width} ${layout.height}`);

    for (const [attribute, value] of Object.entries({
      x:0, y:0, width:layout.width, height:layout.height, preserveAspectRatio:'xMidYMid slice',
    })) this.backdrop.setAttribute(attribute, String(value));

    this.svg.append(
      this.backdrop,
      svgNode('rect', { x:0, y:0, width:layout.width, height:layout.height, class:'atlasBackdropVeil', 'aria-hidden':'true' }),
    );
    if (!this.backdropStarted) {
      this.backdropStarted = true;
      this.backdrop.setAttribute('href', `${import.meta.env.BASE_URL}assets/ui/campaign-atlas-v2.webp`);
    }

    const nodes = svgNode('g', { id:'mapNodes', 'aria-label':this.i18n.t('campaign.atlasGroupAria') });
    const assetRoot = `${import.meta.env.BASE_URL}assets/ui/`;
    for (const { x, y, levelIndex } of layout.stations) {
      const foreign = svgNode('foreignObject', {
        x:x - layout.size * .94, y:y - layout.size * .94, width:layout.size * 1.88, height:layout.size * 1.88,
      });
      const button = document.createElementNS(HTML_NS, 'button') as HTMLButtonElement;
      const comingSoon = levelIndex >= RELEASED_CAMPAIGN_LEVELS;
      const available = !comingSoon && unlocked(levelIndex); const complete = !comingSoon && progress.completed[levelIndex];
      button.type = 'button'; button.dataset.level = String(levelIndex); button.dataset.act = String(levelIndex < 3 ? 0 : levelIndex < 6 ? 1 : 2);
      button.className = `mapNode ${available ? 'unlocked' : 'locked'}${comingSoon ? ' comingSoon' : ''}${complete ? ' completed' : ''}${selected === levelIndex ? ' current' : ''}`;
      button.setAttribute('aria-label', this.i18n.t('campaign.levelAria', {
        level: levelIndex + 1,
        name: this.i18n.text(LEVELS[levelIndex].short),
        locked: available ? '' : this.i18n.t(comingSoon ? 'campaign.levelComingSoonSuffix' : 'campaign.levelLockedSuffix'),
      }));
      const icon = complete
        ? 'campaign-state-cleared-v1.png'
        : available
          ? 'campaign-state-available-v1.png'
          : 'campaign-state-locked-v1.png';
      const status = this.i18n.t(comingSoon
        ? 'campaign.nodeComingSoon'
        : complete
          ? 'campaign.nodeCompleted'
          : available
            ? 'campaign.nodeAvailable'
            : 'campaign.nodeLocked');
      button.innerHTML = `<img class="atlasStateAsset" src="${assetRoot}${icon}" alt="" aria-hidden="true" draggable="false"><span class="atlasLevelNumber">${String(levelIndex + 1).padStart(2, '0')}</span><span class="atlasNodeStatus" aria-hidden="true">${status}</span>`;
      button.addEventListener('click', () => onSelect(levelIndex));
      foreign.append(button); nodes.append(foreign);
    }
    this.svg.append(nodes);
  }

  private finishBackdrop(loaded: boolean): void {
    // Keep the neutral veil for at least one paint even when the preload is
    // already cached. This prevents a one-frame classic/empty atlas flash.
    const settle = () => {
      this.svg.classList.add('atlasReady');
      this.body?.classList.remove('atlasLoading');
      this.body?.classList.toggle('atlasFailed', !loaded);
    };
    if (loaded) requestAnimationFrame(settle); else settle();
  }

}
