import { useSyncExternalStore } from 'react';

import { EN } from './en';

/** Stocarea telefonului, încărcată doar când e nevoie (așa `tr` merge și în teste, fără ea). */
async function storage() {
  return (await import('@react-native-async-storage/async-storage')).default;
}

/*
 * Limba aplicației: română (implicit) sau engleză.
 *
 * Textele rămân scrise în română direct în cod, învelite în `tr('…')`. În română, `tr` întoarce
 * textul așa cum e; în engleză îl caută în dicționarul `EN` (src/i18n/en.ts), unde cheia e chiar
 * textul românesc. Un text fără traducere apare în română, deci nimic nu rămâne gol.
 *
 * Text nou în aplicație: scrie-l în română în `tr('…')` și adaugă traducerea în `en.ts`.
 * Cu variabile: `tr('Până la {time}', { time: '22:00' })`, iar în `en.ts`: 'Until {time}'.
 * Același cuvânt cu sensuri diferite: `tr('Intră|grup')` (în română apare „Intră”, în engleză „Join”).
 *
 * Alegerea se salvează pe telefon (AsyncStorage). Se poate schimba la login și din Setări.
 */

export type Language = 'ro' | 'en';

export const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'ro', label: 'Română' },
  { value: 'en', label: 'English' },
];

const STORAGE_KEY = 'crewd.language';

let current: Language = 'ro';
const listeners = new Set<() => void>();

/** Limba activă acum. */
export function getLanguage(): Language {
  return current;
}

/** Textul în limba activă; `{nume}` din text se înlocuiește cu valorile din `params`. */
export function tr(text: string, params?: Record<string, string | number>): string {
  // „Intră|grup”: după `|` e contextul, pentru același cuvânt cu sensuri diferite în engleză
  // (în română se afișează doar „Intră”).
  const ro = text.includes('|') ? text.slice(0, text.indexOf('|')) : text;
  const translated = current === 'en' ? (EN[text] ?? ro) : ro;
  if (!params) return translated;
  return translated.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in params ? String(params[key]) : match,
  );
}

/**
 * Text cu număr, la singular sau plural: `trPlural(n, '{n} persoană', '{n} persoane')`.
 * În `en.ts` ambele forme au traducerea lor ('{n} person', '{n} people'). `{n}` primește numărul.
 */
export function trPlural(
  count: number,
  one: string,
  many: string,
  params?: Record<string, string | number>,
): string {
  return tr(count === 1 ? one : many, { n: count, ...params });
}

/** Schimbă limba și o ține minte pentru data viitoare. */
export async function setLanguage(language: Language): Promise<void> {
  if (language === current) return;
  current = language;
  listeners.forEach((listener) => listener());
  try {
    await (await storage()).setItem(STORAGE_KEY, language);
  } catch {
    // Nu e grav: limba rămâne aleasă până închizi aplicația.
  }
}

/** Citește limba salvată (la pornirea aplicației). */
export async function loadLanguage(): Promise<Language> {
  try {
    const saved = await (await storage()).getItem(STORAGE_KEY);
    if (saved === 'ro' || saved === 'en') current = saved;
  } catch {
    // Fără limbă salvată: rămâne româna.
  }
  return current;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Limba activă, ca hook: componenta se redesenează când se schimbă limba. */
export function useLanguage(): Language {
  return useSyncExternalStore(subscribe, getLanguage, getLanguage);
}
