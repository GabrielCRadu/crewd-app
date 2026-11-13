import type { Event, LatLng } from '../types/events';
import { addDays, startOfDay } from '../utils/dates';
import { placeAround } from './mockSocial';

/*
 * Date mock pentru tab-ul Evenimente.
 * - Nu țin de un oraș: fiecare eveniment are un decalaj (`offset`, în grade) față de
 *   locația dispozitivului, la fel ca prietenii din mockSocial.ts (0.01° ≈ 1 km).
 *   Decalajele sunt alese ca să apară toate cele trei culori de distanță.
 * - Datele sunt calculate față de ziua de azi, ca demo-ul să aibă mereu
 *   evenimente „acum”, în weekend și în săptămânile următoare.
 * - Titlurile se potrivesc cu mockSocial.ts (grupurile de chat, prietenii de pe hartă).
 * - Afișele sunt imagini placeholder de pe picsum.photos; înlocuiește `imageUrl`.
 */

/** Câmpurile pe care datele mock nu le au (vin doar din Firestore). */
type ExtraFields =
  | 'endsAtEstimated'
  | 'timeNote'
  | 'imageCredit'
  | 'priceInfo'
  | 'organizer'
  | 'ageRestriction'
  | 'ticketUrl'
  | 'source';

/** Un eveniment mock: ca Event, dar cu poziția relativă la dispozitiv în loc de coordonate. */
type MockEvent = Omit<Event, 'location' | ExtraFields> & { offset: LatLng };

const MOCK_DEFAULTS: Pick<Event, ExtraFields> = {
  endsAtEstimated: false,
  timeNote: null,
  imageCredit: null,
  priceInfo: null,
  organizer: null,
  ageRestriction: null,
  ticketUrl: null,
  source: null,
};

const now = new Date();
const HOUR = 60 * 60 * 1000;

/** O zi față de azi (0 = azi, 1 = mâine...) la ora dată. */
function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = addDays(startOfDay(now), dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Ora de acum ± câteva ore (pentru evenimentele în desfășurare). */
function hoursFromNow(hours: number): Date {
  return new Date(now.getTime() + hours * HOUR);
}

/** Câte zile până sâmbăta viitoare (0 dacă azi e sâmbătă). */
const SAT = (6 - now.getDay() + 7) % 7;
const SUN = SAT + 1;

const poster = (id: string) => `https://picsum.photos/seed/crewd-${id}/800/600`;

/** Un eveniment care începe la `start` și durează `hours` ore. */
function timing(start: Date, hours: number) {
  return { startsAt: start, endsAt: new Date(start.getTime() + hours * HOUR) };
}

const MOCK_EVENTS: MockEvent[] = [
  {
    id: 'e1',
    title: 'Jam session în piață',
    description:
      'Muzicieni din oraș cântă jazz și blues în aer liber. Oricine are un instrument poate urca pe scenă pentru o piesă.',
    category: 'muzica',
    tags: ['Concerte', 'Jazz'],
    startsAt: hoursFromNow(-1), // în desfășurare
    endsAt: hoursFromNow(3),
    venueName: 'Piața centrală',
    address: 'Piața centrală',
    offset: { latitude: 0.002, longitude: -0.003 },
    imageUrl: poster('e1'),
    price: 0,
    friendsGoing: ['Andrei', 'Maria'],
    lookingForCompanyCount: 5,
  },
  {
    id: 'e2',
    title: 'Seara de board games',
    description:
      'Zeci de jocuri pe mese, de la Catan la Dixit. Se fac echipe pe loc, așa că poți veni și singur.',
    category: 'social',
    tags: ['Socializare', 'Board games'],
    ...timing(at(1, 20), 4),
    venueName: 'Board Game Café',
    address: 'Centru',
    offset: { latitude: 0.007, longitude: 0.006 },
    imageUrl: poster('e2'),
    price: 20,
    friendsGoing: ['Maria', 'Andrei', 'Ioana'],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e3',
    title: 'Seară de teatru independent',
    description: 'Trei piese scurte, scrise și jucate de trupe independente. Discuție cu actorii la final.',
    category: 'teatru',
    tags: ['Teatru'],
    ...timing(at(SAT, 19), 2),
    venueName: 'Teatrul independent',
    address: 'Cartierul vechi',
    offset: { latitude: -0.015, longitude: 0.018 },
    imageUrl: poster('e3'),
    price: 40,
    friendsGoing: ['Ioana'],
    lookingForCompanyCount: 3,
  },
  {
    id: 'e4',
    title: 'Hamlet',
    description: 'Tragedia lui Shakespeare într-o montare modernă, cu scenografie minimalistă și muzică live.',
    category: 'teatru',
    tags: ['Teatru'],
    ...timing(at(SUN, 19), 3),
    venueName: 'Teatrul Național',
    address: 'Centru',
    offset: { latitude: 0.0075, longitude: -0.0095 }, // unde e Ioana pe hartă
    imageUrl: poster('e4'),
    price: 60,
    friendsGoing: ['Ioana'],
    lookingForCompanyCount: 2,
  },
  {
    id: 'e5',
    title: 'Film în aer liber',
    description: 'Proiecție pe ecran mare în curtea complexului studențesc. Adu o pătură, noi avem popcorn și ceai cald.',
    category: 'film',
    tags: ['Filme'],
    ...timing(at(SUN, 19, 30), 2.5),
    venueName: 'Complexul studențesc',
    address: 'Complexul studențesc',
    offset: { latitude: -0.006, longitude: -0.008 },
    imageUrl: poster('e5'),
    price: 0,
    friendsGoing: ['Andrei'],
    lookingForCompanyCount: 6,
  },
  {
    id: 'e6',
    title: 'Interstellar',
    description: 'Proiecție specială pe ecran mare, cu sunet Dolby Atmos. Vino cu 15 minute mai devreme pentru popcorn.',
    category: 'film',
    tags: ['Filme'],
    ...timing(at(SUN, 20), 3),
    venueName: 'Cinematograful din mall',
    address: 'Mall',
    offset: { latitude: -0.03, longitude: 0.02 },
    imageUrl: poster('e6'),
    price: 35,
    friendsGoing: ['Andrei'],
    lookingForCompanyCount: 2,
  },
  {
    id: 'e7',
    title: 'Warehouse Techno Night',
    description: 'Line-up de DJ locali într-o hală industrială. Sunet puternic, lumini și dans până dimineața.',
    category: 'party',
    tags: ['Party-uri', 'Electronică'],
    ...timing(at(SAT, 23), 6),
    venueName: 'Hala industrială',
    address: 'Zona industrială',
    offset: { latitude: 0.045, longitude: 0.03 },
    imageUrl: poster('e7'),
    price: 70,
    friendsGoing: ['Andrei'],
    lookingForCompanyCount: 8,
  },
  {
    id: 'e8',
    title: 'Silent Disco în parc',
    description: 'Primești căști cu trei canale de muzică și dansezi pe ce îți place. Distracție fără să deranjezi pe nimeni.',
    category: 'party',
    tags: ['Party-uri', 'Pop'],
    startsAt: hoursFromNow(-0.5), // în desfășurare
    endsAt: hoursFromNow(3.5),
    venueName: 'Parcul central',
    address: 'Parcul central',
    offset: { latitude: 0.0035, longitude: 0.0045 }, // unde e Andrei pe hartă
    imageUrl: poster('e8'),
    price: 35,
    friendsGoing: ['Andrei', 'Maria'],
    lookingForCompanyCount: 7,
  },
  {
    id: 'e9',
    title: 'Open Mic: Stand-up Night',
    description: 'Comedianți noi și cunoscuți testează glume noi. Oricine se poate înscrie pentru 5 minute pe scenă.',
    category: 'standup',
    tags: ['Socializare'],
    ...timing(at(0, 20), 2.5),
    venueName: 'Bar Microfonul',
    address: 'Centru',
    offset: { latitude: 0.009, longitude: -0.004 },
    imageUrl: poster('e9'),
    price: 25,
    friendsGoing: ['Maria', 'Andrei'],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e10',
    title: 'Concert rock: trupe locale',
    description: 'Patru trupe din oraș, un singur set fiecare. Rock alternativ, garage și puțin punk.',
    category: 'muzica',
    tags: ['Concerte', 'Rock'],
    ...timing(at(9, 20), 4),
    venueName: 'Clubul de rock',
    address: 'Centru vechi',
    offset: { latitude: 0.025, longitude: 0.03 },
    imageUrl: poster('e10'),
    price: 40,
    friendsGoing: ['Victor'],
    lookingForCompanyCount: 3,
  },
  {
    id: 'e11',
    title: 'Tură de bicicletă la lac',
    description: 'Tură relaxată de ~25 km până la lac și înapoi, cu pauză de picnic. Ritm pentru începători.',
    category: 'sport',
    tags: ['Sport', 'Drumeții'],
    ...timing(at(SUN, 10), 4),
    venueName: 'Lacul de la marginea orașului',
    address: 'În afara orașului',
    offset: { latitude: -0.06, longitude: 0.02 },
    imageUrl: poster('e11'),
    price: 0,
    friendsGoing: ['Victor'],
    lookingForCompanyCount: 5,
  },
  {
    id: 'e12',
    title: 'Fotbal 5x5 amical',
    description: 'Echipele se fac pe loc. Mai e nevoie de câțiva jucători, vino chiar dacă nu cunoști pe nimeni.',
    category: 'sport',
    tags: ['Sport'],
    ...timing(at(4, 18), 2),
    venueName: 'Terenul universității',
    address: 'Campus',
    offset: { latitude: 0.02, longitude: -0.025 },
    imageUrl: poster('e12'),
    price: 15,
    friendsGoing: ['Victor', 'Andrei'],
    lookingForCompanyCount: 6,
  },
  {
    id: 'e13',
    title: 'Deschiderea Târgului de Crăciun',
    description: 'Căsuțe cu produse locale, vin fiert, mâncare de stradă și colinde în piața mare.',
    category: 'social',
    tags: ['Socializare', 'Gătit'],
    ...timing(at(14, 17), 5),
    venueName: 'Piața mare',
    address: 'Centru',
    offset: { latitude: 0.001, longitude: 0.0015 },
    imageUrl: poster('e13'),
    price: 0,
    friendsGoing: ['Maria', 'Andrei', 'Ioana'],
    lookingForCompanyCount: 9,
  },
  {
    id: 'e14',
    title: 'Degustare de vinuri la cramă',
    description: 'Tur prin cramă și degustare de 5 vinuri locale. Transport organizat din centru.',
    category: 'social',
    tags: ['Socializare'],
    ...timing(at(12, 11), 5),
    venueName: 'Crama din afara orașului',
    address: 'În afara orașului',
    offset: { latitude: 0.09, longitude: 0.06 },
    imageUrl: poster('e14'),
    price: 150,
    friendsGoing: [],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e15',
    title: 'Târg de joburi și internship-uri',
    description: 'Peste 30 de companii caută studenți. Adu-ți CV-ul și vino cu întrebări.',
    category: 'studenti',
    tags: ['Socializare'],
    ...timing(at(6, 10), 6),
    venueName: 'Universitatea',
    address: 'Campus',
    offset: { latitude: -0.012, longitude: 0.004 },
    imageUrl: poster('e15'),
    price: 0,
    friendsGoing: ['Ioana', 'Maria'],
    lookingForCompanyCount: 11,
  },
];

/** Evenimentele mock așezate în jurul locației date (de obicei, locația dispozitivului). */
export function placeMockEvents(center: LatLng): Event[] {
  return MOCK_EVENTS.map(({ offset, ...event }) => ({
    ...MOCK_DEFAULTS,
    ...event,
    location: placeAround(center, offset),
  }));
}
