/*
 * Username-ul unic (spec 2026-11-14-username-parola-design.md): strict litere mici, separat de nume.
 * Aceleași reguli sunt și în firestore.rules (formatul și numele rezervate).
 */

export const USERNAME_MIN = 3;
export const USERNAME_MAX = 20;

/** Formatul: litere mici, cifre, `.` și `_`; nu începe și nu se termină cu `.`/`_`. */
const USERNAME_PATTERN = /^[a-z0-9](?:[a-z0-9._]{1,18}[a-z0-9])$/;

/** Nume care nu pot fi alese (forma canonică). */
export const RESERVED_USERNAMES = ['crewd', 'admin', 'support', 'moderator', 'official', 'help', 'system'];

const FORMAT_MESSAGE = 'Doar litere mici, cifre, punct și underscore; nu începe și nu se termină cu punct sau underscore.';

/** Ce rămâne din ce scrie utilizatorul: litere mici, fără spații sau caractere nepermise, maxim 20. */
export function normalizeUsernameInput(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9._]/g, '')
    .slice(0, USERNAME_MAX);
}

/** Forma folosită pentru unicitate: `.` și `_` contează la fel (`radu.g` = `radu_g`). */
export function canonicalUsername(username: string): string {
  return username.replace(/\./g, '_');
}

/** De ce nu e valid username-ul, sau null dacă e valid. */
export function usernameError(username: string): string | null {
  if (username.length < USERNAME_MIN) return `Username-ul are cel puțin ${USERNAME_MIN} caractere.`;
  if (username.length > USERNAME_MAX) return `Username-ul are cel mult ${USERNAME_MAX} de caractere.`;
  if (!USERNAME_PATTERN.test(username)) return FORMAT_MESSAGE;
  if (RESERVED_USERNAMES.includes(canonicalUsername(username))) return 'Username-ul e rezervat.';
  return null;
}

/** Username-ul unei persoane de test, din numele ei (ex. „Ana-Maria” → `anamaria`). */
export function usernameFromName(name: string): string {
  return normalizeUsernameInput(name.normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
}

/** Username-ul s-a dovedit deja luat (ex. la salvare, după ce părea disponibil)? `.` și `_` contează la fel. */
export function isKnownTaken(username: string, takenNames: string[]): boolean {
  const key = canonicalUsername(username);
  return takenNames.some((name) => canonicalUsername(name) === key);
}
