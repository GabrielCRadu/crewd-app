/*
 * Calendarul cu evenimentele la care ești înscris (tab-ul Evenimente → „Calendarul meu”):
 * grila lunii (săptămâna începe luni, ca în România) și gruparea evenimentelor pe zile.
 * Funcții pure, ca să le putem testa.
 */

const MONTHS_LONG = [
  'Ianuarie',
  'Februarie',
  'Martie',
  'Aprilie',
  'Mai',
  'Iunie',
  'Iulie',
  'August',
  'Septembrie',
  'Octombrie',
  'Noiembrie',
  'Decembrie',
];

/** Literele zilelor din capul grilei, de luni până duminică. */
export const WEEKDAY_INITIALS = ['L', 'Ma', 'Mi', 'J', 'V', 'S', 'D'];

/** O zi din grila lunii. */
export interface CalendarDay {
  date: Date;
  /** false pentru zilele din luna dinainte / de după, care completează săptămânile. */
  inMonth: boolean;
}

/** Cheia unei zile, ex. „2026-11-14” (ora locală). */
export function dayKey(d: Date): string {
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${d.getFullYear()}-${m < 10 ? `0${m}` : m}-${day < 10 ? `0${day}` : day}`;
}

/** Prima zi a lunii, la miezul nopții. */
export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** Aceeași lună, mutată cu `months` (ex. -1 = luna trecută). */
export function addMonths(d: Date, months: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + months, 1);
}

/** Ex. „Noiembrie 2026”. */
export function formatMonthYear(d: Date): string {
  return `${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

/** Ex. „noiembrie”. */
export function formatMonthName(d: Date): string {
  return MONTHS_LONG[d.getMonth()]!.toLowerCase();
}

/**
 * Săptămânile lunii (luni → duminică), completate cu zilele vecine.
 * Are 4–6 rânduri, după cum cade luna.
 */
export function monthGrid(month: Date): CalendarDay[][] {
  const first = startOfMonth(month);
  // getDay(): 0 = duminică. Câte zile din luna trecută intră în primul rând (luni = 0).
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Math.ceil((lead + daysInMonth) / 7) * 7;

  const weeks: CalendarDay[][] = [];
  for (let i = 0; i < cells; i++) {
    const date = new Date(first.getFullYear(), first.getMonth(), 1 - lead + i);
    if (i % 7 === 0) weeks.push([]);
    weeks[weeks.length - 1]!.push({ date, inMonth: date.getMonth() === first.getMonth() });
  }
  return weeks;
}

/** Ce trebuie să aibă un eveniment ca să intre în calendar. */
export interface Scheduled {
  startsAt: Date;
}

/** Evenimentele pe zile (după ziua în care încep), fiecare zi sortată după oră. */
export function groupByDay<T extends Scheduled>(events: T[]): Map<string, T[]> {
  const byDay = new Map<string, T[]>();
  for (const e of [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())) {
    const key = dayKey(e.startsAt);
    const list = byDay.get(key);
    if (list) list.push(e);
    else byDay.set(key, [e]);
  }
  return byDay;
}

/** Doar evenimentele care încep în luna dată. */
export function inMonth<T extends Scheduled>(events: T[], month: Date): T[] {
  return events.filter(
    (e) => e.startsAt.getFullYear() === month.getFullYear() && e.startsAt.getMonth() === month.getMonth(),
  );
}

/**
 * Luna pe care deschidem calendarul: cea cu următorul tău eveniment (ca să nu deschizi pe o lună goală),
 * altfel luna curentă.
 */
export function initialMonth<T extends Scheduled & { endsAt: Date }>(events: T[], now = new Date()): Date {
  const next = events
    .filter((e) => e.endsAt.getTime() >= now.getTime())
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())[0];
  return startOfMonth(next ? next.startsAt : now);
}
