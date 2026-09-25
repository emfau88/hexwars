import { SAVE_KEY } from '../core/config';
import type { CampaignProgress } from '../core/types';
import { LEVELS } from '../levels';

const blank = (): CampaignProgress => ({
  completed: LEVELS.map(() => false),
  best: LEVELS.map(() => 0),
  halfSendUsed: false,
  guardianBriefingSeen: false,
  relayBriefingSeen: false,
  relaySendUsed: false,
  relayMasteryBriefingSeen: false,
  relayMasteryUsed: false,
});

export class CampaignProgressStore {
  constructor(private readonly storage: Storage | null = typeof localStorage === 'undefined' ? null : localStorage) {}

  load(): CampaignProgress {
    try {
      const parsed = JSON.parse(this.storage?.getItem(SAVE_KEY) ?? 'null') as (Partial<CampaignProgress> & { fullSendUsed?: boolean }) | null;
      if (parsed && Array.isArray(parsed.completed) && Array.isArray(parsed.best)) {
        return {
          completed: LEVELS.map((_, index) => Boolean(parsed.completed?.[index])),
          best: LEVELS.map((_, index) => Number(parsed.best?.[index]) || 0),
          halfSendUsed: Boolean(parsed.halfSendUsed || parsed.completed?.[1]),
          guardianBriefingSeen: Boolean(parsed.guardianBriefingSeen || parsed.completed?.[4]),
          relayBriefingSeen: Boolean(parsed.relayBriefingSeen || parsed.completed?.[6]),
          relaySendUsed: Boolean(parsed.relaySendUsed || parsed.completed?.[6]),
          relayMasteryBriefingSeen: Boolean(parsed.relayMasteryBriefingSeen || parsed.completed?.[7]),
          relayMasteryUsed: Boolean(parsed.relayMasteryUsed || parsed.completed?.[7]),
        };
      }
    } catch { /* A damaged save must never prevent the game from starting. */ }
    return blank();
  }

  save(progress: CampaignProgress): void {
    try { this.storage?.setItem(SAVE_KEY, JSON.stringify(progress)); } catch { /* Private-mode storage may reject writes. */ }
  }

  complete(progress: CampaignProgress, levelIndex: number, seconds: number): CampaignProgress {
    const next = { ...progress, completed: [...progress.completed], best: [...progress.best] };
    next.completed[levelIndex] = true;
    if (!next.best[levelIndex] || seconds < next.best[levelIndex]) next.best[levelIndex] = seconds;
    this.save(next);
    return next;
  }

  markHalfSendUsed(progress: CampaignProgress): CampaignProgress {
    if (progress.halfSendUsed) return progress;
    const next = { ...progress, halfSendUsed: true };
    this.save(next);
    return next;
  }

  markGuardianBriefingSeen(progress: CampaignProgress): CampaignProgress {
    if (progress.guardianBriefingSeen) return progress;
    const next = { ...progress, guardianBriefingSeen: true };
    this.save(next);
    return next;
  }

  markRelayBriefingSeen(progress: CampaignProgress): CampaignProgress {
    if (progress.relayBriefingSeen) return progress;
    const next = { ...progress, relayBriefingSeen: true };
    this.save(next);
    return next;
  }

  markRelaySendUsed(progress: CampaignProgress): CampaignProgress {
    if (progress.relaySendUsed) return progress;
    const next = { ...progress, relaySendUsed: true };
    this.save(next);
    return next;
  }

  markRelayMasteryBriefingSeen(progress: CampaignProgress): CampaignProgress {
    if (progress.relayMasteryBriefingSeen) return progress;
    const next = { ...progress, relayMasteryBriefingSeen: true };
    this.save(next);
    return next;
  }

  markRelayMasteryUsed(progress: CampaignProgress): CampaignProgress {
    if (progress.relayMasteryUsed) return progress;
    const next = { ...progress, relayMasteryUsed: true };
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
