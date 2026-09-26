import { en, ru, uz, type TranslationKey } from './translations';

export type Language = 'uz' | 'ru' | 'en';
export const DEFAULT_LANGUAGE: Language = 'uz';
export const LANGUAGES: Language[] = ['uz', 'ru', 'en'];

const dictionaries: Record<Language, Record<TranslationKey, string>> = { en, ru, uz };

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = params[key];
    return value === undefined ? match : String(value);
  });
}

/**
 * Plain key -> string lookup, plus a `_one`/`_other` plural convention:
 * translate('review.reviewedCount', { count }) picks `_one` when count === 1.
 */
export function translate(
  language: Language,
  key: TranslationKey | `${string}Count` | string,
  params?: Record<string, string | number>
): string {
  const dict = dictionaries[language];
  const count = params?.count;

  if (typeof count === 'number') {
    const pluralKey = (count === 1 ? `${key}_one` : `${key}_other`) as TranslationKey;
    const template = dict[pluralKey];
    if (template) return interpolate(template, params);
  }

  const template = dict[key as TranslationKey] ?? dictionaries[DEFAULT_LANGUAGE][key as TranslationKey] ?? key;
  return interpolate(template, params);
}

export type { TranslationKey };
