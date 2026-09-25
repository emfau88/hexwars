import type { FeatureFlags, SendMode } from '../core/types';

export const SEND_MODE_STORAGE_KEY = 'hexfront:preferred-send-mode';

const isSendMode = (value: string | null): value is SendMode => value === 'all' || value === 'half' || value === 'group';

export class SendModePreferenceStore {
  constructor(private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) {}

  load(): SendMode {
    try {
      const stored = this.storage?.getItem(SEND_MODE_STORAGE_KEY) ?? null;
      return isSendMode(stored) ? stored : 'all';
    } catch { return 'all'; }
  }

  save(mode: SendMode): void {
    try { this.storage?.setItem(SEND_MODE_STORAGE_KEY, mode); } catch { /* Keep the in-memory selection when storage is unavailable. */ }
  }

  resolve(preferred: SendMode, features: FeatureFlags): SendMode {
    if (preferred === 'all' && features.all) return 'all';
    if (preferred === 'half' && features.half) return 'half';
    if (preferred === 'group' && features.group) return 'group';
    if (features.all) return 'all';
    if (features.half) return 'half';
    return 'group';
  }
}
