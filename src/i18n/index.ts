import { en, type Dict } from './en';
import { ar } from './ar';

export type Lang = 'en' | 'ar';

const dicts: Record<Lang, Dict> = { en, ar };

export function t(lang: Lang): Dict {
  return dicts[lang];
}

/** Path for a route in the given language. Routes are written without a locale, e.g. "/work/x/". */
export function localePath(lang: Lang, route: string): string {
  return lang === 'en' ? route : `/ar${route}`;
}

export function otherLang(lang: Lang): Lang {
  return lang === 'en' ? 'ar' : 'en';
}
