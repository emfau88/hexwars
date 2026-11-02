import assert from 'node:assert/strict';
import test from 'node:test';
import type { FeatureFlags } from '../src/core/types';
import { SEND_MODE_STORAGE_KEY, SendModePreferenceStore } from '../src/persistence/SendModePreferenceStore';

class MemoryStorage {
  readonly values = new Map<string, string>();
  getItem(key: string): string | null { return this.values.get(key) ?? null; }
  setItem(key: string, value: string): void { this.values.set(key, value); }
}

const features = (half: boolean, group: boolean): FeatureFlags => ({ all:true, half, group, relay:false, supply:true });

test('send mode preference defaults to 100 percent and survives a new store instance', () => {
  const storage = new MemoryStorage();
  const first = new SendModePreferenceStore(storage);
  assert.equal(first.load(), 'all');
  first.save('half');
  assert.equal(storage.getItem(SEND_MODE_STORAGE_KEY), 'half');
  assert.equal(new SendModePreferenceStore(storage).load(), 'half');
});

test('an unavailable preference falls back to 100 percent without overwriting the preference', () => {
  const storage = new MemoryStorage(); const store = new SendModePreferenceStore(storage);
  store.save('group');
  assert.equal(store.resolve(store.load(), features(true, false)), 'all');
  assert.equal(store.load(), 'group');
  assert.equal(store.resolve(store.load(), features(true, true)), 'group');
});

test('invalid or inaccessible storage safely falls back to 100 percent', () => {
  const storage = new MemoryStorage(); storage.setItem(SEND_MODE_STORAGE_KEY, 'invalid');
  assert.equal(new SendModePreferenceStore(storage).load(), 'all');
  const unavailable = new SendModePreferenceStore({
    getItem: () => { throw new Error('blocked'); },
    setItem: () => { throw new Error('blocked'); },
  });
  assert.equal(unavailable.load(), 'all');
  assert.doesNotThrow(() => unavailable.save('half'));
});
