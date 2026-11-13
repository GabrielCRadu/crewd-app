import { collection, getDocs, orderBy, query } from 'firebase/firestore';
import type { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';

import { PAST_JOINED_EVENT_IDS, placeMockEvents } from '../data/mockEvents';
import { FRIENDS } from '../data/mockSocial';
import { db } from '../lib/firebase';
import type { CategoryId, Event, EventPrice, LatLng } from '../types/events';

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
  const events = await firestoreCache;
  // DEMO: Firestore are doar evenimente viitoare. Istoricul din Profil și evaluările au nevoie de
  // evenimente trecute la care „ai fost”, așa că le adăugăm pe cele mock până avem înscrieri reale.
  const pastDemo = placeMockEvents(near).filter((e) => PAST_JOINED_EVENT_IDS.includes(e.id));
  return [...events, ...pastDemo];
}

async function loadFromFirestore(): Promise<Event[]> {
  const snapshot = await getDocs(query(collection(db!, 'events'), orderBy('startsAt')));
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
    ticketUrl: d.ticketUrl ?? null,
    source: d.sourceName && d.sourceUrl ? { name: d.sourceName, url: d.sourceUrl } : null,
    ...demoSocial(doc.id),
  };
}

/**
 * DEMO: cine merge și câți caută companie nu sunt încă în Firestore (vor veni din
 * înscrierile reale ale utilizatorilor). Până atunci le generăm stabil din id,
 * cu prietenii mock din mockSocial.ts, ca ecranele să arate ca în ghidul de layout.
 */
function demoSocial(id: string): Pick<Event, 'friendsGoing' | 'lookingForCompanyCount'> {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  const names = FRIENDS.map((f) => f.name);
  const count = hash % (names.length + 1); // 0..3 prieteni
  const start = hash % names.length;
  const friendsGoing = Array.from({ length: count }, (_, i) => names[(start + i) % names.length]!);
  return { friendsGoing, lookingForCompanyCount: (hash >> 3) % 9 };
}
