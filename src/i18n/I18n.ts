import { TRANSLATIONS, type TranslationKey } from './catalog';
import { isLocale, type Locale, type LocalizedText } from './types';

export const LOCALE_STORAGE_KEY = 'hexfront_locale_v1';

type Parameters = Readonly<Record<string, string | number>>;

function format(template: string, parameters: Parameters): string {
  return template.replace(/\{([^}]+)\}/g, (match, key: string) => String(parameters[key] ?? match));
}

export class I18n {
  private current: Locale;

  constructor(storage: Pick<Storage, 'getItem' | 'setItem'> | null = typeof localStorage === 'undefined' ? null : localStorage) {
    this.storage = storage;
    const saved = storage?.getItem(LOCALE_STORAGE_KEY);
    this.current = isLocale(saved) ? saved : 'en';
  }

  private readonly storage: Pick<Storage, 'getItem' | 'setItem'> | null;

  get locale(): Locale { return this.current; }

  setLocale(locale: Locale): boolean {
    if (locale === this.current) return false;
    this.current = locale;
    this.storage?.setItem(LOCALE_STORAGE_KEY, locale);
    return true;
  }

  t(key: TranslationKey, parameters: Parameters = {}): string {
    return format(TRANSLATIONS[this.current][key], parameters);
  }

  text(value: LocalizedText): string { return value[this.current]; }
}
