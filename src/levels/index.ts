import level01 from './level01';
import level02 from './level02';
import level03 from './level03';
import level04 from './level04';
import level05 from './level05';
import level06 from './level06';
import level07 from './level07';
import level08 from './level08';
import level09 from './level09';
import level10 from './level10';
import { localized } from '../i18n/types';

export const LEVELS = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10] as const;

export const CAMPAIGN_ACTS = [
  { roman: localized('ACT I', 'AKT I'), name: localized('FOUNDATIONS', 'GRUNDLAGEN'), range: [0, 2] as const, difficulty: localized('ENTRY', 'EINSTIEG') },
  { roman: localized('ACT II', 'AKT II'), name: localized('TERRAIN & ROUTES', 'GELÄNDE & WEGE'), range: [3, 5] as const, difficulty: localized('TACTICS', 'TAKTIK') },
  { roman: localized('ACT III', 'AKT III'), name: localized('RELAYS & FINALE', 'RELAIS & FINALE'), range: [6, 9] as const, difficulty: localized('COMPLEX', 'KOMPLEX') },
] as const;

export const LEVEL_ICONS = ['↗', '⑂', '◆', '▲', '⌁', '⇄', '◎', '✣', '⟁', '⬡'] as const;

export function campaignActForLevel(index: number): number {
  return CAMPAIGN_ACTS.findIndex(({ range }) => index >= range[0] && index <= range[1]);
}
