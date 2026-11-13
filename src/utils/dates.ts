import type { Event, Period } from '../types/events';

// Formatăm datele manual (în română), ca să nu depindem de suportul Intl de pe telefon.
const MONTHS = [
  'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
  'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie',
];
const MONTHS_SHORT = ['ian', 'feb', 'mar', 'apr', 'mai', 'iun', 'iul', 'aug', 'sept', 'oct', 'nov', 'dec'];
const WEEKDAYS_SHORT = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm'];

// ---------- Ajutoare de bază ----------

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function endOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

/** Ziua săptămânii cu luni = 0 ... duminică = 6 (getDay() din JS începe cu duminică). */
function mondayIndex(d: Date): number {
  return (d.getDay() + 6) % 7;
}

function sameDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// ---------- Perioade pentru PeriodPicker ----------

export interface MonthOption {
  year: number;
  month: number; // 0 = ianuarie
  label: string;
}

/** Luna curentă + următoarele (implicit 6 luni în total). */
export function getUpcomingMonths(count = 6, now = new Date()): MonthOption[] {
  const months: MonthOption[] = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    const year = d.getFullYear();
    const month = d.getMonth();
    // Afișăm anul doar dacă e alt an decât cel curent.
    const label = year === now.getFullYear() ? MONTHS[month] : `${MONTHS[month]} ${year}`;
    months.push({ year, month, label });
  }
  return months;
}

/** Toată luna. */
export function getMonthPeriod(year: number, month: number): Period {
  const start = new Date(year, month, 1);
  const end = endOfDay(new Date(year, month + 1, 0)); // ziua 0 din luna următoare = ultima zi din luna asta
  return { kind: 'month', start: start.getTime(), end: end.getTime(), label: MONTHS[month] };
}

/** Text de tipul „9–15 nov” sau „30 nov” (dacă e o singură zi). */
function formatRange(a: Date, b: Date): string {
  if (sameDay(a, b)) return `${a.getDate()} ${MONTHS_SHORT[a.getMonth()]}`;
  return `${a.getDate()}–${b.getDate()} ${MONTHS_SHORT[b.getMonth()]}`;
}

/**
 * Săptămânile (luni–duminică) dintr-o lună, tăiate la marginile lunii.
 * Săptămânile care au trecut deja nu sunt incluse.
 */
export function getWeeksOfMonth(year: number, month: number, now = new Date()): Period[] {
  const weeks: Period[] = [];
  const lastDay = new Date(year, month + 1, 0);
  let cursor = new Date(year, month, 1);

  while (cursor <= lastDay) {
    const sunday = addDays(cursor, 6 - mondayIndex(cursor));
    const weekEnd = sunday > lastDay ? lastDay : sunday;
    const end = endOfDay(weekEnd).getTime();
    if (end >= now.getTime()) {
      weeks.push({ kind: 'week', start: startOfDay(cursor).getTime(), end, label: formatRange(cursor, weekEnd) });
    }
    cursor = addDays(weekEnd, 1);
  }
  return weeks;
}

/** „Acum”: evenimentele în desfășurare. start/end nu contează, verificăm la filtrare. */
export function getNowPeriod(now = new Date()): Period {
  return { kind: 'now', start: now.getTime(), end: now.getTime(), label: 'Acum' };
}

export function getTodayPeriod(now = new Date()): Period {
  return { kind: 'today', start: startOfDay(now).getTime(), end: endOfDay(now).getTime(), label: 'Azi' };
}

/** Sâmbătă + duminică din weekendul ăsta (dacă azi e duminică, doar azi). */
export function getWeekendPeriod(now = new Date()): Period {
  const idx = mondayIndex(now);
  const saturday = idx === 6 ? now : addDays(now, 5 - idx);
  const sunday = idx === 6 ? now : addDays(saturday, 1);
  return {
    kind: 'weekend',
    start: startOfDay(saturday).getTime(),
    end: endOfDay(sunday).getTime(),
    label: 'Weekendul ăsta',
  };
}

/** Săptămâna curentă (perioada selectată implicit). */
export function getCurrentWeekPeriod(now = new Date()): Period {
  const weeks = getWeeksOfMonth(now.getFullYear(), now.getMonth(), now);
  const t = now.getTime();
  return weeks.find((w) => w.start <= t && t <= w.end) ?? getMonthPeriod(now.getFullYear(), now.getMonth());
}

/** Verifică dacă două perioade sunt aceeași (ca să știm ce chip e activ). */
export function isSamePeriod(a: Period, b: Period): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === 'now') return true;
  return a.start === b.start && a.end === b.end;
}

// ---------- Evenimente ----------

/** Evenimentul e în desfășurare chiar acum? */
export function isLive(event: Event, now = Date.now()): boolean {
  return event.startsAt.getTime() <= now && now <= event.endsAt.getTime();
}

export function formatTime(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** „Azi”, „Mâine” sau „Sâm, 14 nov”. */
export function formatDay(d: Date, now = new Date()): string {
  if (sameDay(d, now)) return 'Azi';
  if (sameDay(d, addDays(now, 1))) return 'Mâine';
  return `${WEEKDAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

/** Ex: „Sâm, 14 nov · 19:00”. */
export function formatEventDate(d: Date, now = new Date()): string {
  return `${formatDay(d, now)} · ${formatTime(d)}`;
}

/** Ex: „Sâm, 14 nov · 19:00 – 22:00” (pentru pagina de detalii). */
export function formatEventDateRange(start: Date, end: Date, now = new Date()): string {
  const endText = sameDay(start, end) ? formatTime(end) : `${formatDay(end, now)} ${formatTime(end)}`;
  return `${formatEventDate(start, now)} – ${endText}`;
}
