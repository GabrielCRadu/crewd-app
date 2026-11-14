import type { AutoBadgeInfo, VotedBadgeInfo } from '../types/badges';
import { tr } from '../i18n';

/** Badge-urile pe care le poți propune cuiva după un eveniment, în ordinea în care apar. */
export const VOTED_BADGES: VotedBadgeInfo[] = [
  { id: 'funny', get label() { return tr('Amuzant'); }, icon: 'balloon-outline' },
  { id: 'warm', get label() { return tr('Cald cu toată lumea'); }, icon: 'heart-outline' },
  { id: 'listener', get label() { return tr('Bun ascultător'); }, icon: 'ear-outline' },
  { id: 'energy', get label() { return tr('Energie bună'); }, icon: 'flash-outline' },
  { id: 'chill', get label() { return tr('Relaxat'); }, icon: 'leaf-outline' },
  { id: 'soul', get label() { return tr('Sufletul grupului'); }, icon: 'star-outline' },
  { id: 'inclusive', get label() { return tr('Îi include pe toți'); }, icon: 'people-circle-outline' },
  { id: 'icebreaker', get label() { return tr('Sparge gheața'); }, icon: 'snow-outline' },
  { id: 'organizer', get label() { return tr('Organizator bun'); }, icon: 'clipboard-outline' },
  { id: 'reliable', get label() { return tr('Se ține de cuvânt'); }, icon: 'shield-checkmark-outline' },
  { id: 'dancer', get label() { return tr('Neobosit pe ringul de dans'); }, icon: 'musical-notes-outline' },
  { id: 'guide', get label() { return tr('Știe locurile'); }, icon: 'compass-outline' },
];

/** Badge-urile automate și pragurile lor (ușor de schimbat). */
export const AUTO_BADGES: AutoBadgeInfo[] = [
  {
    id: 'festivalier',
    get label() { return tr('Festivalier'); },
    icon: 'musical-note-outline',
    rule: { kind: 'category', category: 'muzica', count: 5 },
    get unit() { return tr('concerte'); },
  },
  {
    id: 'party',
    get label() { return tr('Petrecăreț'); },
    icon: 'sparkles-outline',
    rule: { kind: 'category', category: 'party', count: 5 },
    get unit() { return tr('party-uri'); },
  },
  {
    id: 'theatre',
    get label() { return tr('Împătimit de teatru'); },
    icon: 'ticket-outline',
    rule: { kind: 'category', category: 'teatru', count: 3 },
    get unit() { return tr('piese'); },
  },
  {
    id: 'explorer',
    get label() { return tr('Explorator'); },
    icon: 'map-outline',
    rule: { kind: 'categories', count: 3 },
    get unit() { return tr('feluri de evenimente'); },
  },
  {
    id: 'regular',
    get label() { return tr('Nelipsit'); },
    icon: 'ribbon-outline',
    rule: { kind: 'events', count: 10 },
    get unit() { return tr('evenimente'); },
  },
];
