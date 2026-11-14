import { useSyncExternalStore } from 'react';
import { Appearance } from 'react-native';

import { appearance, applyColorScheme } from './colors';
import type { ColorScheme } from './colors';

/*
 * Tema aleasă din Setări: Automat (după telefon), Deschisă sau Închisă.
 *
 * - Alegerea se salvează pe telefon (AsyncStorage) și se citește la pornire, înainte de primul ecran.
 * - „Deschisă” / „Închisă” forțează tema și pentru elementele native (dialoguri, tastatură)
 *   prin Appearance.setColorScheme; „Automat” o lasă pe a telefonului.
 * - La orice schimbare (din Setări sau, pe Automat, din telefon), paleta se schimbă pe loc
 *   (applyColorScheme), iar App.tsx redesenează ecranele (useActiveScheme).
 */

export type ThemeChoice = 'system' | 'light' | 'dark';

const STORAGE_KEY = 'crewd.theme';
let choice: ThemeChoice = 'system';
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Stocarea telefonului, încărcată doar când e nevoie (ca în src/i18n). */
async function storage() {
  return (await import('@react-native-async-storage/async-storage')).default;
}

/** Tema pe care o arată acum telefonul (după override-ul nostru, dacă există). */
function phoneScheme(): ColorScheme {
  return Appearance.getColorScheme() === 'light' ? 'light' : 'dark';
}

/** Aplică alegerea: override nativ + paleta aplicației. */
function apply(): void {
  Appearance.setColorScheme(choice === 'system' ? 'unspecified' : choice);
  const scheme = choice === 'system' ? phoneScheme() : choice;
  if (scheme !== appearance.scheme) applyColorScheme(scheme);
  notify();
}

// Pe „Automat”, aplicația urmează și schimbările făcute în telefon cu aplicația deschisă.
Appearance.addChangeListener(() => {
  if (choice === 'system') {
    const scheme = phoneScheme();
    if (scheme !== appearance.scheme) {
      applyColorScheme(scheme);
      notify();
    }
  }
});

export function getThemeChoice(): ThemeChoice {
  return choice;
}

/** Citește alegerea salvată și o aplică (la pornirea aplicației). */
export async function loadThemeChoice(): Promise<void> {
  try {
    const saved = await (await storage()).getItem(STORAGE_KEY);
    if (saved === 'system' || saved === 'light' || saved === 'dark') choice = saved;
  } catch {
    // Fără alegere salvată: Automat.
  }
  apply();
}

/** Schimbă tema (din Setări) și o ține minte. */
export async function setThemeChoice(next: ThemeChoice): Promise<void> {
  if (next === choice) return;
  choice = next;
  apply();
  try {
    await (await storage()).setItem(STORAGE_KEY, next);
  } catch {
    // Nu e grav: tema rămâne aleasă până închizi aplicația.
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Alegerea din Setări, ca hook. */
export function useThemeChoice(): ThemeChoice {
  return useSyncExternalStore(subscribe, getThemeChoice, getThemeChoice);
}

/** Tema activă ('light' / 'dark'), ca hook: App.tsx redesenează aplicația când se schimbă. */
export function useActiveScheme(): ColorScheme {
  return useSyncExternalStore(subscribe, () => appearance.scheme, () => appearance.scheme);
}
