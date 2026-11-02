import { SafeStorage, browserStorage, type SettingsStorage } from './SafeStorage';

export const SUPPLY_STORAGE_KEY = 'hexfront:auto-supply';
export class SupplyPreferenceStore {
  private readonly storage: SafeStorage;
  constructor(storage: SettingsStorage | null = browserStorage()) { this.storage = new SafeStorage(storage); }
  load(): boolean { return this.storage.getItem(SUPPLY_STORAGE_KEY) !== 'off'; }
  save(enabled: boolean): void { this.storage.setItem(SUPPLY_STORAGE_KEY, enabled ? 'on' : 'off'); }
}
