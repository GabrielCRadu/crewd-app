import type { AutoBadgeInfo, VotedBadgeInfo } from '../types/badges';

/** Badge-urile pe care le poți propune cuiva după un eveniment, în ordinea în care apar. */
export const VOTED_BADGES: VotedBadgeInfo[] = [
  { id: 'funny', label: 'Amuzant', icon: 'balloon-outline' },
  { id: 'warm', label: 'Cald cu toată lumea', icon: 'heart-outline' },
  { id: 'listener', label: 'Bun ascultător', icon: 'ear-outline' },
  { id: 'energy', label: 'Energie bună', icon: 'flash-outline' },
  { id: 'chill', label: 'Relaxat', icon: 'leaf-outline' },
  { id: 'soul', label: 'Sufletul grupului', icon: 'star-outline' },
  { id: 'inclusive', label: 'Îi include pe toți', icon: 'people-circle-outline' },
  { id: 'icebreaker', label: 'Sparge gheața', icon: 'snow-outline' },
  { id: 'organizer', label: 'Organizator bun', icon: 'clipboard-outline' },
  { id: 'reliable', label: 'Se ține de cuvânt', icon: 'shield-checkmark-outline' },
  { id: 'dancer', label: 'Neobosit pe ringul de dans', icon: 'musical-notes-outline' },
  { id: 'guide', label: 'Știe locurile', icon: 'compass-outline' },
];

/** Badge-urile automate și pragurile lor (ușor de schimbat). */
export const AUTO_BADGES: AutoBadgeInfo[] = [
  {
    id: 'festivalier',
    label: 'Festivalier',
    icon: 'musical-note-outline',
    rule: { kind: 'category', category: 'muzica', count: 5 },
    unit: 'concerte',
  },
  {
    id: 'party',
    label: 'Petrecăreț',
    icon: 'sparkles-outline',
    rule: { kind: 'category', category: 'party', count: 5 },
    unit: 'party-uri',
  },
  {
    id: 'theatre',
    label: 'Împătimit de teatru',
    icon: 'ticket-outline',
    rule: { kind: 'category', category: 'teatru', count: 3 },
    unit: 'piese',
  },
  {
    id: 'explorer',
    label: 'Explorator',
    icon: 'map-outline',
    rule: { kind: 'categories', count: 3 },
    unit: 'feluri de evenimente',
  },
  {
    id: 'regular',
    label: 'Nelipsit',
    icon: 'ribbon-outline',
    rule: { kind: 'events', count: 10 },
    unit: 'evenimente',
  },
];
