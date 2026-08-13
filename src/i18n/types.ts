export const SUPPORTED_LOCALES = ['en', 'de'] as const;

export type Locale = typeof SUPPORTED_LOCALES[number];
export type LocalizedText = Readonly<Record<Locale, string>>;

export function localized(en: string, de: string): LocalizedText {
  return { en, de };
}

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && SUPPORTED_LOCALES.includes(value as Locale);
}
