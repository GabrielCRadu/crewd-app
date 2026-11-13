import type { LatLng } from '../types/events';
import type { ChatGroup, ChatMessage, Friend, Person, Profile } from '../types/social';

/*
 * Date mock pentru Descoperă, Hartă, Chat și Profil.
 * Pozițiile de pe hartă sunt relative la locația dispozitivului (vezi FRIENDS).
 */

export const MY_PROFILE: Profile = {
  name: 'Alex',
  age: 22,
  city: 'Orașul tău',
  bio: 'Îmi place să ies cu oameni noi și să mă distrez. Ador board games, jazz-ul live și concertele mici.',
  chosenTags: {
    events: ['Concerte', 'Party-uri', 'Socializare'],
    music: ['Electronică', 'Jazz'],
    hobbies: ['Board games'],
  },
  learnedTags: ['Teatru', 'Drumeții'],
};

/** Toate tag-urile utilizatorului, ca să putem număra tag-urile comune. */
export const MY_TAGS = [
  ...MY_PROFILE.chosenTags.events,
  ...MY_PROFILE.chosenTags.music,
  ...MY_PROFILE.chosenTags.hobbies,
  ...MY_PROFILE.learnedTags,
];

export const PEOPLE: Person[] = [
  {
    id: 'p1',
    name: 'Maria',
    age: 21,
    distanceKm: 1.2,
    tags: ['Board games', 'Concerte', 'Drumeții', 'Fotografie'],
    goingTo: { title: 'Open Mic: Stand-up Night', when: 'vineri' },
  },
  {
    id: 'p2',
    name: 'Andrei',
    age: 23,
    distanceKm: 0.6,
    tags: ['Jazz', 'Electronică', 'Party-uri', 'Gaming'],
    goingTo: { title: 'Warehouse Techno Night', when: 'sâmbătă' },
  },
  {
    id: 'p3',
    name: 'Ioana',
    age: 20,
    distanceKm: 2.4,
    tags: ['Teatru', 'Socializare', 'Gătit'],
    goingTo: { title: 'Hamlet', when: 'duminică' },
  },
  {
    id: 'p4',
    name: 'Victor',
    age: 24,
    distanceKm: 3.1,
    tags: ['Rock', 'Sport', 'Drumeții'],
    goingTo: null,
  },
];

/** Prietenii mock, așezați în jurul locației dispozitivului (0.01° ≈ 1 km). */
export const FRIENDS: Friend[] = [
  { id: 'f1', name: 'Andrei', offset: { latitude: 0.0035, longitude: 0.0045 }, status: 'La Silent Disco în parc, acum' },
  { id: 'f2', name: 'Maria', offset: { latitude: -0.0065, longitude: 0.0085 }, status: 'Acasă' },
  { id: 'f3', name: 'Ioana', offset: { latitude: 0.0075, longitude: -0.0095 }, status: 'La Hamlet, de la 19:00' },
];

/** Poziția absolută a unui prieten mock, relativ la locația dată. */
export function placeAround(center: LatLng, offset: LatLng): LatLng {
  return { latitude: center.latitude + offset.latitude, longitude: center.longitude + offset.longitude };
}

export const MY_GROUPS: ChatGroup[] = [
  {
    id: 'g1',
    name: 'Strategii și glume proaste',
    eventTitle: 'Open Mic: Stand-up Night',
    membersCount: 4,
    commonTagsCount: 3,
    meetupWhen: 'azi la 19:45',
    meetupWhere: 'în fața intrării',
    lastMessage: { author: 'Maria', text: 'aduc eu Dixit!', time: '18:42' },
    unreadCount: 3,
  },
  {
    id: 'g2',
    name: 'Rockerii de cartier',
    eventTitle: 'Concert rock: trupe locale',
    membersCount: 5,
    commonTagsCount: 2,
    meetupWhen: 'sâmbătă la 19:15',
    meetupWhere: 'la intrare',
    lastMessage: { author: 'Andrei', text: 'luăm dopuri de urechi, nu discutăm', time: 'ieri' },
    unreadCount: 0,
  },
];

export const SUGGESTED_GROUPS: ChatGroup[] = [
  {
    id: 'g3',
    name: 'Începători la stand-up',
    eventTitle: 'Open Mic: Stand-up Night',
    membersCount: 3,
    commonTagsCount: 2,
    meetupWhen: 'vineri la 20:00',
    meetupWhere: 'la bar',
    lastMessage: null,
    unreadCount: 0,
  },
  {
    id: 'g4',
    name: 'Techno fără pretenții',
    eventTitle: 'Warehouse Techno Night',
    membersCount: 5,
    commonTagsCount: 4,
    meetupWhen: 'sâmbătă la 23:00',
    meetupWhere: 'la intrare',
    lastMessage: null,
    unreadCount: 0,
  },
];

export const MESSAGES: Record<string, ChatMessage[]> = {
  g1: [
    { id: 'm1', author: 'Maria', text: 'Salut tuturor! Cine vine sigur diseară?' },
    { id: 'm2', author: 'Andrei', text: 'Eu vin. Ajung puțin mai devreme să prind masă.' },
    { id: 'm3', author: null, text: 'Vin și eu! E prima dată când ajung acolo, ne vedem în față?' },
    { id: 'm4', author: 'Maria', text: 'Da, 19:45 în fața intrării. Aduc eu Dixit!' },
  ],
  g2: [
    { id: 'm1', author: 'Andrei', text: 'luăm dopuri de urechi, nu discutăm' },
  ],
};

/** Găsește un grup (al tău sau sugerat) după id. */
export function getGroup(id: string): ChatGroup | undefined {
  return [...MY_GROUPS, ...SUGGESTED_GROUPS].find((g) => g.id === id);
}
