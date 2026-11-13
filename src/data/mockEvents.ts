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
 * - Afișele sunt luate din baza de date (afișele reale ale evenimentelor importate, de la organizatori),
 *   alese după categorie; creditul e în `imageCredit`. Doar pentru demo, ca și datele importate.
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
type MockEvent = Omit<Event, 'location' | ExtraFields> & Partial<Pick<Event, ExtraFields>> & { offset: LatLng };

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
    imageUrl: "https://imgcdn3.iabilet.ro/m_N3H9dSX2Y-ZzAe1_3pM8rOZXk=/fit-in/1200x1200/https%3A%2F%2Fstatic3.iabilet.ro%2Fimg%2Fdb%2Fevent%2F01%2Ffe%2Fbd%2F00000439252-ff08.png",
    imageCredit: "iaBilet.ro",
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
    imageUrl: "https://zilesinopti.ro/wp-content/uploads/2026/11/b486fb80-6e59-477a-b27c-43fb62157617.jpg",
    imageCredit: "Zile \u0219i Nop\u021bi",
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
    imageUrl: "https://zilesinopti.ro/wp-content/uploads/2026/10/a5df90af-f44b-4e64-b970-486d52329bc1.png",
    imageCredit: "Zile \u0219i Nop\u021bi",
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
    imageUrl: "https://imgcdn3.iabilet.ro/hiV4vW257elytnSOgODBRe5PC5U=/fit-in/1200x1200/https%3A%2F%2Fstatic3.iabilet.ro%2Fimg%2Fdb%2Fevent%2F01%2Ff8%2F3a%2F00000416160-43d8.png",
    imageCredit: "iaBilet.ro",
    price: 60,
    friendsGoing: ['Ioana'],
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
    imageUrl: "https://zilesinopti.ro/wp-content/uploads/2026/10/ec833ad9-c735-47d5-abf5-8cf42bb47980.jpg",
    imageCredit: "Zile \u0219i Nop\u021bi",
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
    imageUrl: "https://zilesinopti.ro/wp-content/uploads/2026/10/34998d55-bf14-4933-ad85-174091d1e299-1024x536.jpg",
    imageCredit: "Zile \u0219i Nop\u021bi",
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
    imageUrl: "https://imgcdn3.iabilet.ro/eR4inIu_SO6XI8FK0ugb7AO3hSk=/fit-in/1200x1200/https%3A%2F%2Fstatic3.iabilet.ro%2Fimg%2Fdb%2Fevent%2F01%2Ff0%2F50%2F00000430810-2422.png",
    imageCredit: "iaBilet.ro",
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
    imageUrl: "https://imgcdn3.iabilet.ro/tL9lLkIr5WPEJh6Iqk9_AUIa1S4=/fit-in/1200x1200/https%3A%2F%2Fstatic3.iabilet.ro%2Fimg%2Fdb%2Fevent%2F01%2Ffd%2Fca%2F00000442841-56b9.png",
    imageCredit: "iaBilet.ro",
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
    imageUrl: "https://www.onevent.ro/wp-content/uploads/2026/11/231911-4565063417061887.jpg",
    imageCredit: "OnEvent.ro",
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
    imageUrl: "https://www.onevent.ro/wp-content/uploads/2026/11/231914-1107024135506105.jpg",
    imageCredit: "OnEvent.ro",
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
    imageUrl: "https://zilesinopti.ro/wp-content/uploads/2026/10/2dcf1b63-d7ab-40be-b27b-27fd81cd6da0.jpg",
    imageCredit: "Zile \u0219i Nop\u021bi",
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
    imageUrl: "https://www.onevent.ro/wp-content/uploads/2026/11/231943-1588871713010575.jpg",
    imageCredit: "OnEvent.ro",
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
    imageUrl: "https://www.onevent.ro/wp-content/uploads/2026/11/231953-1579241447533932.jpg",
    imageCredit: "OnEvent.ro",
    price: 0,
    friendsGoing: ['Ioana', 'Maria'],
    lookingForCompanyCount: 11,
  },

  // ---------- Evenimente trecute (la care ai fost; apar în istoricul din Profil) ----------
  {
    id: 'e16',
    title: 'Concert de jazz în pivniță',
    description: 'Un trio de jazz într-o pivniță mică, cu lumânări pe mese. Set lung, cu improvizații.',
    category: 'muzica',
    tags: ['Concerte', 'Jazz'],
    ...timing(at(-1, 20), 3),
    venueName: 'Pivnița de jazz',
    address: 'Centru',
    offset: { latitude: 0.004, longitude: -0.006 },
    imageUrl: "https://zilesinopti.ro/wp-content/uploads/2026/11/05a8d86c-7e07-419b-9286-8cd2be39f830.jpg",
    imageCredit: "Zile \u0219i Nop\u021bi",
    price: 30,
    // Bianca nu e încă prietenă: v-ați cunoscut aici și ți-a trimis cerere (vezi friendsService).
    friendsGoing: ['Maria', 'Andrei', 'Bianca'],
    lookingForCompanyCount: 0,
  },
  {
    id: 'e17',
    title: 'Seară de karaoke',
    description: 'Karaoke cu playlist uriaș, de la manele ironice la rock clasic. Cântă cine are curaj.',
    category: 'social',
    tags: ['Socializare'],
    ...timing(at(-3, 21), 3),
    venueName: 'Bar Refren',
    address: 'Centru',
    offset: { latitude: -0.005, longitude: 0.007 },
    imageUrl: "https://cdn.sanity.io/images/hbw6hd0s/production/389e67f86bfe3271beef388ef85a75d435d33e31-1920x1005.png?w=1200&fit=max&auto=format",
    imageCredit: "FITT",
    price: 0,
    friendsGoing: ['Ioana', 'Victor', 'Maria'],
    lookingForCompanyCount: 0,
  },
  {
    id: 'e18',
    title: 'Drumeție pe dealuri',
    description: 'Traseu de 12 km prin pădure, cu prânz la stână. Ritm lejer.',
    category: 'sport',
    tags: ['Sport', 'Drumeții'],
    ...timing(at(-8, 9), 6),
    venueName: 'Dealurile de lângă oraș',
    address: 'În afara orașului',
    offset: { latitude: -0.05, longitude: -0.04 },
    imageUrl: "https://imgcdn3.iabilet.ro/DuXuL6qz8WeGM1U5jto5hLBq6C4=/fit-in/1200x1200/https%3A%2F%2Fstatic3.iabilet.ro%2Fimg%2Fdb%2Fevent%2F02%2F08%2Fa6%2F00000436693-5812.jpg",
    imageCredit: "iaBilet.ro",
    price: 0,
    friendsGoing: ['Victor'],
    lookingForCompanyCount: 0,
  },
];

/** Evenimentele trecute la care erai înscris la pornirea aplicației (pentru istoric). */
export const PAST_JOINED_EVENT_IDS = ['e16', 'e17', 'e18'];

/** Evenimentele mock așezate în jurul locației date (de obicei, locația dispozitivului). */
export function placeMockEvents(center: LatLng): Event[] {
  return MOCK_EVENTS.map(({ offset, ...event }) => ({
    ...MOCK_DEFAULTS,
    ...event,
    location: placeAround(center, offset),
  }));
}
