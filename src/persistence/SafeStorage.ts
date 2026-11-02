export type SettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

let unavailable = false;
const memory = new Map<string, string>();
const fallbacks = new WeakMap<SettingsStorage, Map<string, string>>();

function failed(): void { unavailable = true; }
export function storageUnavailable(): boolean { return unavailable; }

/** Accessing the property itself can throw in sandboxed portal frames. */
export function browserStorage(): SettingsStorage | null {
  try { return typeof window === 'undefined' ? null : window.localStorage; }
  catch { failed(); return null; }
}

export class SafeStorage implements SettingsStorage {
  private readonly fallback: Map<string, string>;
  constructor(private readonly storage: SettingsStorage | null = browserStorage()) {
    // Browser stores share a session fallback; injected stores stay isolated for callers/tests.
    if (storage) {
      this.fallback = fallbacks.get(storage) ?? new Map();
      fallbacks.set(storage, this.fallback);
    } else this.fallback = typeof window === 'undefined' ? new Map() : memory;
  }
  getItem(key: string): string | null {
    if (this.fallback.has(key)) return this.fallback.get(key)!;
    try { return this.storage?.getItem(key) ?? null; }
    catch { failed(); return null; }
  }
  setItem(key: string, value: string): void {
    this.fallback.set(key, value);
    try {
      if (!this.storage) { if (typeof window !== 'undefined') failed(); return; }
      this.storage.setItem(key, value);
    } catch { failed(); }
  }
}
