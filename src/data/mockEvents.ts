import type { Event } from '../types/events';
import { addDays, startOfDay } from '../utils/dates';

/*
 * Date mock pentru tab-ul Evenimente, în Chișinău.
 * - Datele sunt calculate față de ziua de azi, ca demo-ul să aibă mereu
 *   evenimente „acum”, în weekend și în săptămânile următoare.
 * - Coordonatele sunt aproximative (locuri reale din oraș), alese ca să apară
 *   toate cele trei culori de distanță față de centru.
 * - Afișele sunt imagini placeholder de pe picsum.photos; înlocuiește `imageUrl`.
 */

const now = new Date();
const HOUR = 60 * 60 * 1000;

/** O zi față de azi (0 = azi, 1 = mâine...) la ora dată. */
function at(dayOffset: number, hour: number, minute = 0): Date {
  const d = addDays(startOfDay(now), dayOffset);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Ora de acum ± câteva ore (pentru evenimentele LIVE). */
function hoursFromNow(hours: number): Date {
  return new Date(now.getTime() + hours * HOUR);
}

function plusHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * HOUR);
}

/** Câte zile până sâmbăta viitoare (0 dacă azi e sâmbătă). */
const SAT = (6 - now.getDay() + 7) % 7;
const SUN = SAT + 1;

const poster = (id: string) => `https://picsum.photos/seed/unsolo-${id}/800/600`;

/** Un eveniment care începe la `start` și durează `hours` ore. */
function timing(start: Date, hours: number) {
  return { startsAt: start, endsAt: plusHours(start, hours) };
}

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Zdob și Zdub',
    description:
      'Concert aniversar cu cele mai cunoscute piese ale trupei, plus câteva surprize. Energie, fanfară și mult rock.',
    category: 'muzica',
    tags: ['rock', 'folk', 'concert', 'live-music'],
    ...timing(at(SAT, 19), 3),
    venueName: 'Palatul Național „Nicolae Sulac”',
    address: 'str. Pușkin 21, Chișinău',
    location: { latitude: 47.0275, longitude: 28.8285 },
    imageUrl: poster('e1'),
    price: 250,
    friendsGoing: ['Ana', 'Mihai', 'Victor'],
    lookingForCompanyCount: 5,
  },
  {
    id: 'e2',
    title: 'Vivaldi – Anotimpurile',
    description: 'Orchestra de cameră interpretează integral „Anotimpurile”, într-una dintre cele mai frumoase săli din oraș.',
    category: 'muzica',
    tags: ['clasic', 'concert', 'live-music'],
    ...timing(at(16, 18, 30), 2),
    venueName: 'Sala cu Orgă',
    address: 'bd. Ștefan cel Mare și Sfânt 81, Chișinău',
    location: { latitude: 47.0247, longitude: 28.8316 },
    imageUrl: poster('e2'),
    price: 150,
    friendsGoing: ['Elena'],
    lookingForCompanyCount: 2,
  },
  {
    id: 'e3',
    title: 'Hamlet',
    description: 'Tragedia lui Shakespeare într-o montare modernă, cu scenografie minimalistă și muzică live.',
    category: 'teatru',
    tags: ['teatru', 'drama', 'clasic'],
    ...timing(at(1, 18), 3),
    venueName: 'Teatrul Național „Mihai Eminescu”',
    address: 'bd. Ștefan cel Mare și Sfânt 79, Chișinău',
    location: { latitude: 47.0251, longitude: 28.833 },
    imageUrl: poster('e3'),
    price: 120,
    friendsGoing: ['Ioana', 'Dan'],
    lookingForCompanyCount: 3,
  },
  {
    id: 'e4',
    title: 'O scrisoare pierdută',
    description: 'Comedia lui Caragiale, la fel de actuală ca acum o sută de ani. Râsete garantate.',
    category: 'teatru',
    tags: ['teatru', 'comedie', 'clasic'],
    ...timing(at(9, 19), 2.5),
    venueName: 'Teatrul Satiricus „I. L. Caragiale”',
    address: 'str. 31 August 1989, Chișinău',
    location: { latitude: 47.0262, longitude: 28.835 },
    imageUrl: poster('e4'),
    price: 100,
    friendsGoing: [],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e5',
    title: 'Interstellar',
    description: 'Proiecție specială pe ecran mare, cu sunet Dolby Atmos. Vino cu 15 minute mai devreme pentru popcorn.',
    category: 'film',
    tags: ['film', 'sci-fi'],
    ...timing(at(2, 20), 3),
    venueName: 'Cinema Patria (MallDova)',
    address: 'str. Arborilor 21, Chișinău',
    location: { latitude: 46.993, longitude: 28.8582 },
    imageUrl: poster('e5'),
    price: 90,
    friendsGoing: ['Mihai'],
    lookingForCompanyCount: 2,
  },
  {
    id: 'e6',
    title: 'Maraton „Stăpânul Inelelor”',
    description: 'Toată trilogia, una după alta, cu pauze de pizza între filme. Poți veni și pleca oricând.',
    category: 'film',
    tags: ['film', 'fantasy', 'maraton'],
    startsAt: hoursFromNow(-2), // LIVE: a început acum 2 ore
    endsAt: hoursFromNow(6),
    venueName: 'Cineclubul din Dendrariu',
    address: 'str. Ion Creangă 1, Chișinău',
    location: { latitude: 47.039, longitude: 28.815 },
    imageUrl: poster('e6'),
    price: 60,
    friendsGoing: ['Ana', 'Cristina'],
    lookingForCompanyCount: 6,
  },
  {
    id: 'e7',
    title: 'Warehouse Techno Night',
    description: 'Line-up de DJ locali într-o hală industrială. Sunet puternic, lumini și dans până dimineața.',
    category: 'party',
    tags: ['party', 'techno', 'dj'],
    ...timing(at(5, 23), 6),
    venueName: 'Hala Uzinelor',
    address: 'str. Uzinelor, sect. Ciocana, Chișinău',
    location: { latitude: 47.045, longitude: 28.905 },
    imageUrl: poster('e7'),
    price: 200,
    friendsGoing: ['Victor'],
    lookingForCompanyCount: 8,
  },
  {
    id: 'e8',
    title: 'Silent Disco în parc',
    description: 'Primești căști cu trei canale de muzică și dansezi pe ce îți place. Distracție fără să deranjezi pe nimeni.',
    category: 'party',
    tags: ['party', 'dj', 'outdoor'],
    ...timing(at(SAT, 20), 4),
    venueName: 'Parcul Valea Morilor',
    address: 'Parcul Valea Morilor, Chișinău',
    location: { latitude: 47.03, longitude: 28.815 },
    imageUrl: poster('e8'),
    price: 80,
    friendsGoing: ['Ana', 'Ioana', 'Elena', 'Dan'],
    lookingForCompanyCount: 7,
  },
  {
    id: 'e9',
    title: 'Open Mic: Stand-up Night',
    description: 'Comedianți noi și cunoscuți testează glume noi. Oricine se poate înscrie pentru 5 minute pe scenă.',
    category: 'standup',
    tags: ['stand-up', 'comedie', 'open-mic'],
    ...timing(at(1, 20), 2),
    venueName: 'Bar „Microfonul”',
    address: 'str. Alexandru cel Bun 35, Chișinău',
    location: { latitude: 47.0235, longitude: 28.829 },
    imageUrl: poster('e9'),
    price: 50,
    friendsGoing: ['Mihai', 'Dan'],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e10',
    title: 'Râsete în Râșcani',
    description: 'Show de stand-up cu trei comedianți, despre viața de cartier, transportul public și părinți.',
    category: 'standup',
    tags: ['stand-up', 'comedie'],
    ...timing(at(8, 19), 2),
    venueName: 'Casa de Cultură Râșcani',
    address: 'sect. Râșcani, Chișinău',
    location: { latitude: 47.05, longitude: 28.865 },
    imageUrl: poster('e10'),
    price: 120,
    friendsGoing: [],
    lookingForCompanyCount: 3,
  },
  {
    id: 'e11',
    title: 'Tură de bicicletă la Ghidighici',
    description: 'Tură relaxată de ~30 km în jurul lacului, cu pauză de picnic. Ritm pentru începători.',
    category: 'sport',
    tags: ['sport', 'ciclism', 'outdoor'],
    ...timing(at(SUN, 10), 4),
    venueName: 'Lacul Ghidighici',
    address: 'Ghidighici, mun. Chișinău',
    location: { latitude: 47.087, longitude: 28.797 },
    imageUrl: poster('e11'),
    price: 0,
    friendsGoing: ['Victor', 'Cristina'],
    lookingForCompanyCount: 5,
  },
  {
    id: 'e12',
    title: 'Fotbal 5x5 amical',
    description: 'Echipele se fac pe loc. Mai e nevoie de câțiva jucători, vino chiar dacă nu cunoști pe nimeni.',
    category: 'sport',
    tags: ['sport', 'fotbal', 'studenti'],
    ...timing(at(4, 18), 2),
    venueName: 'Terenul de sport USM',
    address: 'str. Alexei Mateevici 60, Chișinău',
    location: { latitude: 47.0195, longitude: 28.818 },
    imageUrl: poster('e12'),
    price: 0,
    friendsGoing: ['Dan'],
    lookingForCompanyCount: 6,
  },
  {
    id: 'e13',
    title: 'Târg de iarnă și vin fiert',
    description: 'Căsuțe cu produse locale, mâncare, vin fiert și muzică live în centrul orașului.',
    category: 'social',
    tags: ['social', 'targ', 'food', 'outdoor'],
    startsAt: hoursFromNow(-3), // LIVE
    endsAt: hoursFromNow(5),
    venueName: 'Piața Marii Adunări Naționale',
    address: 'bd. Ștefan cel Mare și Sfânt, Chișinău',
    location: { latitude: 47.0245, longitude: 28.834 },
    imageUrl: poster('e13'),
    price: 0,
    friendsGoing: ['Ana', 'Mihai', 'Ioana', 'Elena', 'Cristina'],
    lookingForCompanyCount: 9,
  },
  {
    id: 'e14',
    title: 'Degustare de vinuri la Cricova',
    description: 'Tur prin galeriile subterane și degustare de 5 vinuri. Transport organizat din centru.',
    category: 'social',
    tags: ['social', 'vin', 'degustare'],
    ...timing(at(12, 11), 4),
    venueName: 'Combinatul de Vinuri Cricova',
    address: 'str. Ungureanu 1, Cricova',
    location: { latitude: 47.1386, longitude: 28.8614 },
    imageUrl: poster('e14'),
    price: 450,
    friendsGoing: [],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e15',
    title: 'Târg de joburi și internship-uri',
    description: 'Peste 30 de companii IT și nu numai caută studenți. Adu-ți CV-ul și vino cu întrebări.',
    category: 'studenti',
    tags: ['studenti', 'cariera', 'networking'],
    ...timing(at(6, 10), 6),
    venueName: 'Campusul UTM',
    address: 'str. Studenților 9, Chișinău',
    location: { latitude: 47.0605, longitude: 28.867 },
    imageUrl: poster('e15'),
    price: 0,
    friendsGoing: ['Ioana'],
    lookingForCompanyCount: 11,
  },
];
