import type { Event } from '../types/events';
import { getLanguage, tr } from '../i18n';

// Formatăm datele manual (română sau engleză, după limba aleasă), ca să nu depindem de suportul Intl de pe telefon.
const en = () => getLanguage() === 'en';
const MONTHS_SHORT = () =>
  en()
    ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    : ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sept', 'oct', 'nov', 'dec'];
const WEEKDAYS_SHORT = () =>
  en() ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];
const WEEKDAYS_LONG = () =>
  en()
    ? ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    : ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];

// ---------- Ajutoare de bază ----------

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// ---------- Evenimente ----------

/** Evenimentul e în desfășurare chiar acum? */
export function isLive(event: Event, now = Date.now()): boolean {
  return event.startsAt.getTime() <= now && now <= event.endsAt.getTime();
}

/** Evenimentul s-a terminat? (de aici încolo apare în istoric și poți evalua oamenii) */
export function hasEnded(event: Event, now = Date.now()): boolean {
  return event.endsAt.getTime() < now;
}

/** Ex: „13 nov”. */
export function formatShortDate(d: Date): string {
  return `${d.getDate()} ${MONTHS_SHORT()[d.getMonth()]}`;
}

/** Ex: „20:00”. */
export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Ziua prescurtată, cu majuscule, pentru caseta de dată din „Urmează” (ex. „VIN”). */
export function formatWeekdayShort(d: Date): string {
  return WEEKDAYS_SHORT()[d.getDay()]!.toUpperCase();
}

/** „Azi”, „Mâine” sau „Sâm, 14 nov”. */
export function formatDay(d: Date, now = new Date()): string {
  if (sameDay(d, now)) return 'Azi';
  if (sameDay(d, addDays(now, 1))) return tr('Mâine');
  return `${WEEKDAYS_SHORT()[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT()[d.getMonth()]}`;
}

/** Ex: „Azi · 20:00” (mini-cardul de pe hartă). */
export function formatEventDate(d: Date, now = new Date()): string {
  return `${formatDay(d, now)} · ${formatTime(d)}`;
}

/** Ex: „Vineri, 13 nov” (caseta „Când” din detalii; ora se afișează separat, dedesubt). */
export function formatLongDay(d: Date): string {
  return `${WEEKDAYS_LONG()[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT()[d.getMonth()]}`;
}
