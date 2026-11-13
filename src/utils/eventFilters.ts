import type { CategoryId, Event, EventWithDistance, LatLng } from '../types/events';
import { haversineKm } from './distance';

/** Evenimentul nu s-a terminat încă? */
export function isUpcomingOrLive(event: Event, now = Date.now()): boolean {
  return event.endsAt.getTime() >= now;
}

/** Nicio categorie selectată = „Toate”. */
export function matchesCategories(event: Event, categoryIds: CategoryId[]): boolean {
  return categoryIds.length === 0 || categoryIds.includes(event.category);
}

/** Adaugă distanța până la utilizator la fiecare eveniment. */
export function addDistance(events: Event[], from: LatLng): EventWithDistance[] {
  return events.map((e) => ({ ...e, distanceKm: haversineKm(from, e.location) }));
}

/** Returnează o listă nouă, sortată după ora de început (nu o modifică pe cea primită). */
export function sortByDate<T extends Event>(events: T[]): T[] {
  return [...events].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
