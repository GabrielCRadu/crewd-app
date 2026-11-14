import type { Category, CategoryId } from '../types/events';
import { tr } from '../i18n';

/** Lista categoriilor afișate ca chip-uri (denumirile ca în machetă). Ordinea de aici e ordinea de pe ecran. */
export const CATEGORIES: Category[] = [
  { id: 'muzica', get label() { return tr('Concerte'); }, icon: 'musical-notes-outline' },
  { id: 'party', get label() { return tr('Party-uri'); }, icon: 'sparkles-outline' },
  { id: 'teatru', get label() { return tr('Teatru'); }, icon: 'happy-outline' },
  { id: 'social', get label() { return tr('Socializare'); }, icon: 'people-outline' },
  { id: 'standup', get label() { return tr('Stand-up'); }, icon: 'mic-outline' },
  { id: 'ateliere', get label() { return tr('Ateliere'); }, icon: 'color-palette-outline' },
  { id: 'sport', get label() { return tr('Sport'); }, icon: 'football-outline' },
  { id: 'studenti', get label() { return tr('Studenți'); }, icon: 'school-outline' },
];

/** Găsește o categorie după id. */
export function getCategory(id: CategoryId): Category {
  // `!` e sigur: fiecare CategoryId are o intrare în CATEGORIES.
  return CATEGORIES.find((c) => c.id === id)!;
}
