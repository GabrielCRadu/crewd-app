/*
 * Data nașterii: în aplicație e un șir „AAAA-LL-ZZ” (fără oră, fără fus orar);
 * în Firestore e un Timestamp la miezul nopții UTC din acea zi (vezi profileService.ts).
 */

/** Aplicația pune oameni necunoscuți în legătură, așa că cerem vârsta minimă de 18 ani. */
export const MIN_AGE = 18;
export const MAX_AGE = 99;

const MONTHS = [
  'ianuarie',
  'februarie',
  'martie',
  'aprilie',
  'mai',
  'iunie',
  'iulie',
  'august',
  'septembrie',
  'octombrie',
  'noiembrie',
  'decembrie',
];

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** Data aleasă în selector (ora locală) → „AAAA-LL-ZZ”. */
export function toBirthDateString(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** „AAAA-LL-ZZ” → Date la miezul nopții, ora locală (pentru selector). */
export function fromBirthDateString(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y!, m! - 1, d!);
}

/** „AAAA-LL-ZZ” → „12 martie 2004”. */
export function formatBirthDate(s: string): string {
  const [y, m, d] = s.split('-').map(Number);
  return `${d} ${MONTHS[m! - 1]} ${y}`;
}

/** Vârsta în ani împliniți, la data `now`. */
export function ageFromBirthDate(s: string, now = new Date()): number {
  const [y, m, d] = s.split('-').map(Number);
  let age = now.getFullYear() - y!;
  const hadBirthday = now.getMonth() + 1 > m! || (now.getMonth() + 1 === m! && now.getDate() >= d!);
  if (!hadBirthday) age -= 1;
  return age;
}

/** Cea mai recentă dată de naștere acceptată (azi acum 18 ani). */
export function latestAllowedBirthDate(now = new Date()): Date {
  return new Date(now.getFullYear() - MIN_AGE, now.getMonth(), now.getDate());
}

/** Cea mai veche dată de naștere acceptată. */
export function earliestAllowedBirthDate(now = new Date()): Date {
  return new Date(now.getFullYear() - MAX_AGE - 1, now.getMonth(), now.getDate() + 1);
}
