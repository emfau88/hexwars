import { SAVE_KEY } from '../core/config';
import type { CampaignProgress } from '../core/types';
import { LEVELS } from '../levels';

const blank = (): CampaignProgress => ({ completed: LEVELS.map(() => false), best: LEVELS.map(() => 0) });

export class CampaignProgressStore {
  constructor(private readonly storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage) {}

  load(): CampaignProgress {
    try {
      const parsed = JSON.parse(this.storage?.getItem(SAVE_KEY) ?? 'null') as Partial<CampaignProgress> | null;
      if (parsed && Array.isArray(parsed.completed) && Array.isArray(parsed.best)) {
        return {
          completed: LEVELS.map((_, index) => Boolean(parsed.completed?.[index])),
          best: LEVELS.map((_, index) => Number(parsed.best?.[index]) || 0),
        };
      }
    } catch { /* A damaged save must never prevent the game from starting. */ }
    return blank();
  }

  save(progress: CampaignProgress): void {
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* Private-mode storage may reject writes. */ }
  }

  complete(progress: CampaignProgress, levelIndex: number, seconds: number): CampaignProgress {
    const next = { completed: [...progress.completed], best: [...progress.best] };
    next.completed[levelIndex] = true;
    if (!next.best[levelIndex] || seconds < next.best[levelIndex]) next.best[levelIndex] = seconds;
    this.save(next);
    return next;
  }

  reset(): CampaignProgress {
    const progress = blank(); this.save(progress); return progress;
  }

  isUnlocked(progress: CampaignProgress, index: number, debugUnlock = false): boolean {
    return debugUnlock || index === 0 || Boolean(progress.completed[index] || progress.completed[index - 1]);
  }

  focus(progress: CampaignProgress): number {
    let index = 0;
    while (index < LEVELS.length - 1 && progress.completed[index]) index += 1;
    return index;
  }
}

