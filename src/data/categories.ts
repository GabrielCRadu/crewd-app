import type { Category, CategoryId } from '../types/events';

/** Lista categoriilor afișate ca chip-uri (denumirile ca în machetă). Ordinea de aici e ordinea de pe ecran. */
export const CATEGORIES: Category[] = [
  { id: 'muzica', label: 'Concerte', icon: 'musical-notes-outline' },
  { id: 'party', label: 'Party-uri', icon: 'sparkles-outline' },
  { id: 'film', label: 'Filme', icon: 'film-outline' },
  { id: 'teatru', label: 'Teatru', icon: 'happy-outline' },
  { id: 'social', label: 'Socializare', icon: 'people-outline' },
  { id: 'standup', label: 'Stand-up', icon: 'mic-outline' },
  { id: 'ateliere', label: 'Ateliere', icon: 'color-palette-outline' },
  { id: 'sport', label: 'Sport', icon: 'football-outline' },
  { id: 'studenti', label: 'Studenți', icon: 'school-outline' },
];

/** Găsește o categorie după id. */
export function getCategory(id: CategoryId): Category {
  // `!` e sigur: fiecare CategoryId are o intrare în CATEGORIES.
  return CATEGORIES.find((c) => c.id === id)!;
}
