import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { CAMPAIGN_ACTS, LEVELS } from '../src/levels';
import { DE_TRANSLATIONS, EN_TRANSLATIONS, isTranslationKey } from '../src/i18n/catalog';
import { I18n, LOCALE_STORAGE_KEY } from '../src/i18n/I18n';
import { SUPPORTED_LOCALES } from '../src/i18n/types';

test('English and German catalogues have the same complete key set', () => {
  assert.deepEqual(Object.keys(DE_TRANSLATIONS).sort(), Object.keys(EN_TRANSLATIONS).sort());
  for (const locale of SUPPORTED_LOCALES) {
    const catalogue = locale === 'en' ? EN_TRANSLATIONS : DE_TRANSLATIONS;
    for (const [key, value] of Object.entries(catalogue)) {
      assert.ok(value.trim(), `${locale}.${key} must not be empty`);
    }
  }
});

test('every campaign level and act supplies non-empty English and German copy', () => {
  for (const [index, level] of LEVELS.entries()) {
    for (const field of ['name', 'short', 'blurb', 'objective', 'rule'] as const) {
      for (const locale of SUPPORTED_LOCALES) assert.ok(level[field][locale].trim(), `Level ${index + 1} ${field}.${locale} must not be empty`);
    }
  }
  for (const [index, act] of CAMPAIGN_ACTS.entries()) {
    for (const field of ['roman', 'name', 'difficulty'] as const) {
      for (const locale of SUPPORTED_LOCALES) assert.ok(act[field][locale].trim(), `Act ${index + 1} ${field}.${locale} must not be empty`);
    }
  }
});

test('every translation binding in index.html points to a catalogue key', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  const bindings = [...html.matchAll(/data-i18n(?:-aria-label|-title|-content)?="([^"]+)"/g)].map((match) => match[1]);
  assert.ok(bindings.length > 30, 'Expected the application shell to expose localization bindings');
  for (const key of bindings) assert.ok(isTranslationKey(key), `Unknown translation key in index.html: ${key}`);
});

test('English is the default and a German selection survives a new I18n instance', () => {
  const values = new Map<string, string>();
  const storage = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
  };
  const first = new I18n(storage);
  assert.equal(first.locale, 'en');
  assert.equal(first.t('campaign.levelAria', { level: 2, name: 'TWO ROUTES', locked: ' — locked' }), 'Level 2: TWO ROUTES — locked');
  assert.equal(first.setLocale('de'), true);
  assert.equal(values.get(LOCALE_STORAGE_KEY), 'de');
  assert.equal(new I18n(storage).locale, 'de');
});
