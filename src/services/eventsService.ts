import type { Event, LatLng } from '../types/events';
import { placeMockEvents } from '../data/mockEvents';

/*
 * Sursa de date pentru evenimente.
 * Ecranele folosesc DOAR funcțiile de aici, așa că la trecerea pe Firestore
 * se schimbă doar acest fișier. Exemplu (după ce `db` e configurat):
 *
 *   const snap = await getDocs(collection(db, 'events'));
 *   return snap.docs.map((d) => {
 *     const data = d.data();
 *     return { ...data, id: d.id, startsAt: data.startsAt.toDate(), endsAt: data.endsAt.toDate() } as Event;
 *   });
 *
 * `near` e locația utilizatorului: acum așază datele mock în jurul ei,
 * mai târziu poate filtra evenimentele din apropiere.
 */

/** Toate evenimentele. E `async` ca să arate la fel ca un apel real către Firestore. */
export async function getEvents(near: LatLng): Promise<Event[]> {
  return placeMockEvents(near);
}
