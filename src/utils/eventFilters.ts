import type { CategoryId, Event, EventWithDistance, LatLng, Period } from '../types/events';
import { haversineKm } from './distance';

/** Evenimentul nu s-a terminat încă? */
export function isUpcomingOrLive(event: Event, now = Date.now()): boolean {
  return event.endsAt.getTime() >= now;
}

/** Evenimentul cade (măcar parțial) în perioada aleasă? Cele terminate nu se afișează. */
export function isEventInPeriod(event: Event, period: Period, now = Date.now()): boolean {
  const start = event.startsAt.getTime();
  const end = event.endsAt.getTime();
  if (end < now) return false;
  if (period.kind === 'now') return start <= now && now <= end;
  return start <= period.end && end >= period.start;
}

/** Nicio categorie selectată = „Toate”. */
export function matchesCategories(event: Event, categoryIds: CategoryId[]): boolean {
  return categoryIds.length === 0 || categoryIds.includes(event.category);
}

/** Adaugă distanța până la utilizator la fiecare eveniment. */
export function addDistance(events: Event[], from: LatLng): EventWithDistance[] {
  return events.map((e) => ({ ...e, distanceKm: haversineKm(from, e.location) }));
}

/** Filtrul principal: perioadă + categorii. */
export function filterEvents(
  events: EventWithDistance[],
  period: Period,
  categoryIds: CategoryId[],
): EventWithDistance[] {
  return events.filter((e) => isEventInPeriod(e, period) && matchesCategories(e, categoryIds));
}

export type SortBy = 'date' | 'distance';

/** Returnează o listă nouă, sortată (nu o modifică pe cea primită). */
export function sortEvents(events: EventWithDistance[], by: SortBy): EventWithDistance[] {
  return [...events].sort((a, b) =>
    by === 'date' ? a.startsAt.getTime() - b.startsAt.getTime() : a.distanceKm - b.distanceKm,
  );
}
