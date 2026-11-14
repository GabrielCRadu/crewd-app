import { describe, expect, it } from '@jest/globals';

import {
  addMonths,
  dayKey,
  formatMonthYear,
  groupByDay,
  inMonth,
  initialMonth,
  monthGrid,
} from '../calendar';

const at = (y: number, m: number, d: number, h = 20) => new Date(y, m - 1, d, h, 0);

describe('monthGrid', () => {
  it('starts weeks on Monday and fills with neighbour days', () => {
    // 1 noiembrie 2026 e duminică → primul rând începe luni 26 octombrie.
    const weeks = monthGrid(at(2026, 11, 14));
    expect(weeks[0]![0]!.date.getDate()).toBe(26);
    expect(weeks[0]![0]!.inMonth).toBe(false);
    expect(weeks[0]![6]!.date.getDate()).toBe(1);
    expect(weeks[0]![6]!.inMonth).toBe(true);
  });

  it('has full weeks covering the whole month', () => {
    const weeks = monthGrid(at(2026, 11, 1));
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    const days = weeks.flat().filter((d) => d.inMonth);
    expect(days).toHaveLength(30);
    expect(weeks).toHaveLength(6);
  });

  it('uses 4 rows when the month fits exactly (Feb 2027 starts Monday)', () => {
    expect(monthGrid(at(2027, 2, 10))).toHaveLength(4);
  });
});

describe('addMonths / formatMonthYear', () => {
  it('crosses the year', () => {
    expect(formatMonthYear(addMonths(at(2026, 12, 31), 1))).toBe('Ianuarie 2027');
    expect(formatMonthYear(addMonths(at(2026, 1, 31), -1))).toBe('Decembrie 2025');
  });
});

describe('groupByDay', () => {
  it('groups by start day and sorts by time', () => {
    const late = { id: 'b', startsAt: at(2026, 11, 14, 22) };
    const early = { id: 'a', startsAt: at(2026, 11, 14, 18) };
    const other = { id: 'c', startsAt: at(2026, 11, 20, 19) };
    const byDay = groupByDay([late, other, early]);
    expect([...byDay.keys()]).toEqual(['2026-11-14', '2026-11-20']);
    expect(byDay.get('2026-11-14')!.map((e) => e.id)).toEqual(['a', 'b']);
  });

  it('pads the day key', () => {
    expect(dayKey(at(2026, 3, 5))).toBe('2026-03-05');
  });
});

describe('inMonth', () => {
  it('keeps only events starting in that month', () => {
    const events = [{ startsAt: at(2026, 11, 30) }, { startsAt: at(2026, 12, 1) }];
    expect(inMonth(events, at(2026, 11, 1))).toHaveLength(1);
  });
});

describe('initialMonth', () => {
  const now = at(2026, 11, 14, 12);

  it('opens on the month of the next event', () => {
    const events = [{ startsAt: at(2026, 12, 5), endsAt: at(2026, 12, 5, 23) }];
    expect(initialMonth(events, now).getMonth()).toBe(11);
  });

  it('ignores events that already ended and falls back to the current month', () => {
    const events = [{ startsAt: at(2026, 10, 1), endsAt: at(2026, 10, 1, 23) }];
    expect(initialMonth(events, now).getMonth()).toBe(10);
  });
});
