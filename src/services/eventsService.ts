import { Timestamp, collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { placeMockEvents } from '../data/mockEvents';
import { db } from '../lib/firebase';
import type { CategoryId, Event, EventPrice, LatLng } from '../types/events';
import { safeExternalUrl } from '../utils/safeText';

/*
 * Sursa de date pentru evenimente. Ecranele folosesc DOAR funcțiile de aici.
 *
 * - Cu Firebase configurat (.env.local): citește colecția Firestore `events`
 *   (încărcată de scripts/import-events.mjs; schema e descrisă în docs/firebase.md).
 * - Fără config: datele mock, așezate în jurul locației dispozitivului.
 */

const CATEGORY_IDS: CategoryId[] = ['muzica', 'teatru', 'party', 'standup', 'ateliere', 'sport', 'social', 'studenti'];

/** Când organizatorul nu anunță ora de final, considerăm că evenimentul durează atât. */
const DEFAULT_DURATION_MINUTES = 180;

/** Evenimentele din Firestore se citesc o singură dată și se refolosesc pe toate ecranele. */
let firestoreCache: Promise<Event[]> | null = null;

/** Toate evenimentele. `near` (locația utilizatorului) contează doar pentru datele mock. */
export async function getEvents(near: LatLng): Promise<Event[]> {
  if (!db) return placeMockEvents(near);
  if (!firestoreCache) {
    firestoreCache = loadFromFirestore().catch((error: unknown) => {
      // Nu păstrăm eroarea în cache: următorul ecran încearcă din nou.
      firestoreCache = null;
      throw error;
    });
  }
  // Conturile reale văd doar evenimentele reale (audit: fără date demo amestecate cu cele reale).
  return firestoreCache;
}

async function loadFromFirestore(): Promise<Event[]> {
  // Doar evenimentele de acum 60 de zile încolo: istoricul recent + cele viitoare (audit: nu toată colecția).
  const since = Timestamp.fromMillis(Date.now() - 60 * 24 * 60 * 60 * 1000);
  const snapshot = await getDocs(query(collection(db!, 'events'), where('startsAt', '>=', since), orderBy('startsAt')));
  return snapshot.docs.map(fromDoc).filter((e): e is Event => e !== null);
}

/** Transformă un document Firestore în Event. Documentele incomplete sunt ignorate. */
function fromDoc(doc: QueryDocumentSnapshot<DocumentData>): Event | null {
  const d = doc.data();
  if (!d.title || !d.startsAt || !d.location) return null;

  const startsAt: Date = d.startsAt.toDate();
  const durationMinutes: number = typeof d.durationMinutes === 'number' ? d.durationMinutes : DEFAULT_DURATION_MINUTES;
  const endsAt: Date = d.endsAt ? d.endsAt.toDate() : new Date(startsAt.getTime() + durationMinutes * 60_000);
  const priceInfo: EventPrice | null = d.price ?? null;

  return {
    id: doc.id,
    title: d.title,
    description: d.description ?? '',
    category: CATEGORY_IDS.includes(d.category) ? d.category : 'social',
    tags: Array.isArray(d.tags) ? d.tags : [],
    startsAt,
    endsAt,
    endsAtEstimated: !d.endsAt,
    timeNote: d.timeNote ?? null,
    venueName: d.venueName ?? '',
    address: d.address ?? '',
    location: { latitude: d.location.latitude, longitude: d.location.longitude },
    imageUrl: d.imageUrl ?? '',
    imageCredit: d.imageCredit ?? null,
    price: priceInfo ? (priceInfo.isFree ? 0 : priceInfo.min) : null,
    priceInfo,
    organizer: d.organizer ?? null,
    ageRestriction: d.ageRestriction ?? null,
    ticketUrl: safeExternalUrl(d.ticketUrl),
    // Atribuirea rămâne vizibilă; linkul doar dacă e https (un link tel:/sms:/market: din import nu se deschide).
    source: d.sourceName ? { name: d.sourceName, url: safeExternalUrl(d.sourceUrl) ?? '' } : null,
    // Cine merge / cine caută companie vor veni din înscrierile reale; până atunci, nimic inventat.
    friendsGoing: [],
    lookingForCompanyCount: 0,
  };
}

