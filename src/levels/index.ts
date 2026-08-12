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

export const LEVELS = [level01, level02, level03, level04, level05, level06, level07, level08, level09, level10] as const;

export const CAMPAIGN_ACTS = [
  { roman: 'AKT I', name: 'GRUNDLAGEN', range: [0, 2] as const, difficulty: 'EINSTIEG' },
  { roman: 'AKT II', name: 'GELÄNDE & FRONTEN', range: [3, 5] as const, difficulty: 'TAKTIK' },
  { roman: 'AKT III', name: 'RELAIS & FINALE', range: [6, 9] as const, difficulty: 'KOMPLEX' },
] as const;

export const LEVEL_ICONS = ['↗', '⑂', '◆', '▲', '⌁', '⇄', '◎', '✣', '⟁', '⬡'] as const;

export function campaignActForLevel(index: number): number {
  return CAMPAIGN_ACTS.findIndex(({ range }) => index >= range[0] && index <= range[1]);
}

