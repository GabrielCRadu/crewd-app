import type { Event } from '../types/events';
import { MOCK_EVENTS } from '../data/mockEvents';

/*
 * Sursa de date pentru evenimente.
 * Ecranele folosesc DOAR funcțiile de aici, așa că la trecerea pe Firestore
 * se schimbă doar acest fișier. Exemplu (după ce colegul configurează `db`):
 *
 *   const snap = await getDocs(collection(db, 'events'));
 *   return snap.docs.map((d) => {
 *     const data = d.data();
 *     return { ...data, id: d.id, startsAt: data.startsAt.toDate(), endsAt: data.endsAt.toDate() } as Event;
 *   });
 */

/** Toate evenimentele. E `async` ca să arate la fel ca un apel real către Firestore. */
export async function getEvents(): Promise<Event[]> {
  return MOCK_EVENTS;
}

/** Un singur eveniment după id (sau null dacă nu există). */
export async function getEventById(id: string): Promise<Event | null> {
  return MOCK_EVENTS.find((e) => e.id === id) ?? null;
}
