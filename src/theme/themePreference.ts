/*
 * Tema aleasă în Setări: Luminoasă, Întunecată sau Ca telefonul (spec 2026-11-14-profil-membru-tema-design.md).
 *
 * src/theme/colors.ts calculează culorile o singură dată, la încărcare. De aceea alegerea se citește
 * din telefon la pornire (index.ts), înainte să se încarce ecranele, iar la schimbare aplicația se reîncarcă.
 * Fișierul nu importă nimic din temă, ca să poată fi încărcat primul.
 */

export type ThemePreference = 'light' | 'dark' | 'system';
export type ColorScheme = 'light' | 'dark';

const STORAGE_KEY = 'crewd.theme';

let current: ThemePreference = 'system';

/** Stocarea telefonului, încărcată doar când e nevoie (așa fișierul merge și în teste). */
async function storage() {
  return (await import('@react-native-async-storage/async-storage')).default;
}

/** E una dintre cele trei alegeri? */
export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

/** Tema efectivă: alegerea explicită, sau cea a telefonului (închisă dacă telefonul nu spune). */
export function resolveColorScheme(preference: ThemePreference, system: string | null | undefined): ColorScheme {
  if (preference !== 'system') return preference;
  return system === 'light' ? 'light' : 'dark';
}

/** Alegerea curentă (citită la pornire). */
export function getThemePreference(): ThemePreference {
  return current;
}

/** Citește alegerea salvată pe telefon; se apelează o dată, la pornire, înainte de ecrane. */
export async function loadThemePreference(): Promise<void> {
  try {
    const saved = await (await storage()).getItem(STORAGE_KEY);
    if (isThemePreference(saved)) current = saved;
  } catch {
    // Fără stocare: rămâne „Ca telefonul”.
  }
}

/** Salvează alegerea (se aplică după reîncărcarea aplicației). */
export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  current = preference;
  await (await storage()).setItem(STORAGE_KEY, preference);
}
