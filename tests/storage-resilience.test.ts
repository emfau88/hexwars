import assert from 'node:assert/strict';
import test from 'node:test';
import { I18n } from '../src/i18n/I18n';
import { CampaignProgressStore } from '../src/persistence/CampaignProgressStore';
import { SendModePreferenceStore } from '../src/persistence/SendModePreferenceStore';
import { SupplyPreferenceStore } from '../src/persistence/SupplyPreferenceStore';
import { browserStorage, storageUnavailable } from '../src/persistence/SafeStorage';

for (const mode of ['blocked', 'quota'] as const) {
  test(`${mode}: language, progress and controls remain usable in memory`, () => {
    const storage = {
      getItem: () => { if (mode === 'blocked') throw new Error('blocked'); return null; },
      setItem: () => { throw new Error('quota'); },
    };
    const i18n = new I18n(storage);
    assert.equal(i18n.setLocale('de'), true);
    assert.equal(i18n.locale, 'de');
    assert.equal(new I18n(storage).locale, 'de');
    const campaign = new CampaignProgressStore(storage);
    campaign.complete(campaign.load(), 0, 24);
    assert.equal(new CampaignProgressStore(storage).load().best[0], 24);
    new SendModePreferenceStore(storage).save('half');
    assert.equal(new SendModePreferenceStore(storage).load(), 'half');
    new SupplyPreferenceStore(storage).save(false);
    assert.equal(new SupplyPreferenceStore(storage).load(), false);
    assert.equal(storageUnavailable(), true);
  });
}

test('a throwing localStorage getter does not block game initialization', () => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { configurable: true, value: {
    get localStorage() { throw new Error('SecurityError'); },
  } });
  try {
    assert.equal(browserStorage(), null);
    assert.doesNotThrow(() => new I18n());
    assert.doesNotThrow(() => new CampaignProgressStore().load());
    assert.doesNotThrow(() => new SendModePreferenceStore().load());
  } finally {
    if (descriptor) Object.defineProperty(globalThis, 'window', descriptor);
    else Reflect.deleteProperty(globalThis, 'window');
  }
});

test('damaged best times do not poison the existing campaign', () => {
  const storage = { getItem: () => JSON.stringify({ completed: [true, true], best: [-4, 'Infinity', 20] }), setItem() {} };
  const progress = new CampaignProgressStore(storage).load();
  assert.deepEqual(progress.best.slice(0, 3), [0, 0, 20]);
  assert.equal(progress.completed[1], true);
  assert.equal(progress.completed.length, 10);
});
