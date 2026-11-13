import type { Event } from '../types/events';
import { addDays, startOfDay } from '../utils/dates';

/*
 * Date mock pentru tab-ul Evenimente, în Timișoara.
 * - Datele sunt calculate față de ziua de azi, ca demo-ul să aibă mereu
 *   evenimente „acum”, în weekend și în săptămânile următoare.
 * - Coordonatele sunt aproximative (locuri reale din oraș), alese ca să apară
 *   toate cele trei culori de distanță față de centru (Piața Victoriei).
 * - Afișele sunt imagini placeholder de pe picsum.photos; înlocuiește `imageUrl`.
 * - Tag-urile folosesc aceleași denumiri ca tag-urile din profil (onboarding).
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

const poster = (id: string) => `https://picsum.photos/seed/crewd-tm-${id}/800/600`;

/** Un eveniment care începe la `start` și durează `hours` ore. */
function timing(start: Date, hours: number) {
  return { startsAt: start, endsAt: plusHours(start, hours) };
}

export const MOCK_EVENTS: Event[] = [
  {
    id: 'e1',
    title: 'Jam session în Piața Unirii',
    description:
      'Muzicieni din oraș cântă jazz și blues în aer liber. Oricine are un instrument poate urca pe scenă pentru o piesă.',
    category: 'muzica',
    tags: ['concerte', 'jazz', 'live-music'],
    startsAt: hoursFromNow(-1), // LIVE: a început acum o oră
    endsAt: hoursFromNow(3),
    venueName: 'Piața Unirii',
    address: 'Piața Unirii, Timișoara',
    location: { latitude: 45.7578, longitude: 21.229 },
    imageUrl: poster('e1'),
    price: 0,
    friendsGoing: ['Andrei', 'Maria'],
    lookingForCompanyCount: 5,
  },
  {
    id: 'e2',
    title: 'Seara de board games',
    description:
      'Zeci de jocuri pe mese, de la Catan la Dixit. Se fac echipe pe loc, așa că poți veni și singur. Ceaiul e din partea casei.',
    category: 'social',
    tags: ['socializare', 'board-games'],
    ...timing(at(1, 20), 4),
    venueName: 'Board Game Café',
    address: 'str. Alba Iulia, Timișoara',
    location: { latitude: 45.755, longitude: 21.228 },
    imageUrl: poster('e2'),
    price: 20,
    friendsGoing: ['Maria', 'Andrei', 'Ioana'],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e3',
    title: 'Seară de teatru independent',
    description: 'Trei piese scurte, scrise și jucate de trupe independente din Timișoara. Discuție cu actorii la final.',
    category: 'teatru',
    tags: ['teatru', 'independent'],
    ...timing(at(SAT, 19), 2),
    venueName: 'Teatrul Basca, Fabric',
    address: 'cartierul Fabric, Timișoara',
    location: { latitude: 45.759, longitude: 21.256 },
    imageUrl: poster('e3'),
    price: 40,
    friendsGoing: ['Ioana'],
    lookingForCompanyCount: 3,
  },
  {
    id: 'e4',
    title: 'Carmen',
    description: 'Opera lui Bizet, cu orchestra și corul Operei Naționale Române. Spectacol în limba franceză, cu supratitrare.',
    category: 'teatru',
    tags: ['teatru', 'opera', 'clasic'],
    ...timing(at(9, 19), 3),
    venueName: 'Opera Națională Română',
    address: 'Piața Victoriei 2, Timișoara',
    location: { latitude: 45.7543, longitude: 21.2262 },
    imageUrl: poster('e4'),
    price: 80,
    friendsGoing: [],
    lookingForCompanyCount: 2,
  },
  {
    id: 'e5',
    title: 'Film în aer liber',
    description: 'Proiecție pe ecran mare în Complexul Studențesc. Adu o pătură, noi avem popcorn și ceai cald.',
    category: 'film',
    tags: ['filme', 'outdoor'],
    ...timing(at(SUN, 19, 30), 2.5),
    venueName: 'Complexul Studențesc',
    address: 'Complexul Studențesc, Timișoara',
    location: { latitude: 45.747, longitude: 21.239 },
    imageUrl: poster('e5'),
    price: 0,
    friendsGoing: ['Andrei'],
    lookingForCompanyCount: 6,
  },
  {
    id: 'e6',
    title: 'Maraton „Stăpânul Inelelor”',
    description: 'Toată trilogia, una după alta, cu pauze de pizza între filme. Poți veni și pleca oricând.',
    category: 'film',
    tags: ['filme', 'maraton', 'fantasy'],
    startsAt: hoursFromNow(-2), // LIVE
    endsAt: hoursFromNow(6),
    venueName: 'Cinema City, Shopping City',
    address: 'Calea Șagului 100, Timișoara',
    location: { latitude: 45.729, longitude: 21.199 },
    imageUrl: poster('e6'),
    price: 45,
    friendsGoing: ['Maria', 'Ioana'],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e7',
    title: 'Open-air techno',
    description: 'DJ locali, sunet puternic și lumini într-o livadă de la marginea orașului. Transport organizat din centru.',
    category: 'party',
    tags: ['party-uri', 'electronica', 'outdoor'],
    ...timing(at(5, 22), 6),
    venueName: 'Livada din Dumbrăvița',
    address: 'Dumbrăvița, jud. Timiș',
    location: { latitude: 45.798, longitude: 21.247 },
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
    tags: ['party-uri', 'pop', 'electronica'],
    ...timing(at(SAT, 20), 4),
    venueName: 'Parcul Rozelor',
    address: 'Parcul Rozelor, Timișoara',
    location: { latitude: 45.7505, longitude: 21.229 },
    imageUrl: poster('e8'),
    price: 35,
    friendsGoing: ['Maria', 'Ioana', 'Andrei'],
    lookingForCompanyCount: 7,
  },
  {
    id: 'e9',
    title: 'Open Mic: Stand-up Night',
    description: 'Comedianți noi și cunoscuți testează glume noi. Oricine se poate înscrie pentru 5 minute pe scenă.',
    category: 'standup',
    tags: ['stand-up', 'comedie'],
    ...timing(at(1, 21), 2),
    venueName: 'Bar „Microfonul”',
    address: 'Piața Libertății, Timișoara',
    location: { latitude: 45.7565, longitude: 21.227 },
    imageUrl: poster('e9'),
    price: 25,
    friendsGoing: ['Andrei'],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e10',
    title: 'Stand-up: Bănățeni, dar grăbiți',
    description: 'Show de stand-up despre viața în Timișoara, trotinete și „lasă că merge și așa”.',
    category: 'standup',
    tags: ['stand-up', 'comedie'],
    ...timing(at(8, 19), 2),
    venueName: 'Iulius Congress Hall',
    address: 'Piața Consiliul Europei 2, Timișoara',
    location: { latitude: 45.766, longitude: 21.227 },
    imageUrl: poster('e10'),
    price: 60,
    friendsGoing: [],
    lookingForCompanyCount: 3,
  },
  {
    id: 'e11',
    title: 'Tură de bicicletă prin Pădurea Giroc',
    description: 'Tură relaxată de ~25 km pe malul Begăi și prin pădure, cu pauză de picnic. Ritm pentru începători.',
    category: 'sport',
    tags: ['sport', 'drumetii', 'ciclism'],
    ...timing(at(SUN, 10), 4),
    venueName: 'Pădurea Giroc',
    address: 'Giroc, jud. Timiș',
    location: { latitude: 45.694, longitude: 21.249 },
    imageUrl: poster('e11'),
    price: 0,
    friendsGoing: ['Ioana'],
    lookingForCompanyCount: 5,
  },
  {
    id: 'e12',
    title: 'Fotbal 5x5 amical',
    description: 'Echipele se fac pe loc. Mai e nevoie de câțiva jucători, vino chiar dacă nu cunoști pe nimeni.',
    category: 'sport',
    tags: ['sport', 'fotbal'],
    ...timing(at(4, 18), 2),
    venueName: 'Baza sportivă Politehnica',
    address: 'zona Stadionului Dan Păunescu, Timișoara',
    location: { latitude: 45.7425, longitude: 21.256 },
    imageUrl: poster('e12'),
    price: 15,
    friendsGoing: ['Andrei'],
    lookingForCompanyCount: 6,
  },
  {
    id: 'e13',
    title: 'Deschiderea Târgului de Crăciun',
    description: 'Căsuțe cu produse locale, vin fiert, kürtőskalács și concerte de colinde în Piața Victoriei.',
    category: 'social',
    tags: ['socializare', 'gatit', 'targ'],
    ...timing(at(14, 17), 5),
    venueName: 'Piața Victoriei',
    address: 'Piața Victoriei, Timișoara',
    location: { latitude: 45.7537, longitude: 21.2257 },
    imageUrl: poster('e13'),
    price: 0,
    friendsGoing: ['Maria', 'Andrei', 'Ioana'],
    lookingForCompanyCount: 9,
  },
  {
    id: 'e14',
    title: 'Degustare la Cramele Recaș',
    description: 'Tur prin crame și degustare de 5 vinuri bănățene. Transport organizat din centrul Timișoarei.',
    category: 'social',
    tags: ['socializare', 'degustare'],
    ...timing(at(12, 11), 5),
    venueName: 'Cramele Recaș',
    address: 'Recaș, jud. Timiș',
    location: { latitude: 45.802, longitude: 21.513 },
    imageUrl: poster('e14'),
    price: 150,
    friendsGoing: [],
    lookingForCompanyCount: 4,
  },
  {
    id: 'e15',
    title: 'Târg de joburi și internship-uri',
    description: 'Peste 30 de companii IT și nu numai caută studenți. Adu-ți CV-ul și vino cu întrebări.',
    category: 'studenti',
    tags: ['studenti', 'cariera'],
    ...timing(at(6, 10), 6),
    venueName: 'Universitatea de Vest',
    address: 'Bd. Vasile Pârvan 4, Timișoara',
    location: { latitude: 45.747, longitude: 21.231 },
    imageUrl: poster('e15'),
    price: 0,
    friendsGoing: ['Ioana', 'Maria'],
    lookingForCompanyCount: 11,
  },
];
