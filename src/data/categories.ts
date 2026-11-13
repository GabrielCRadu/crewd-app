import type { Category, CategoryId } from '../types/events';

/** Lista categoriilor afișate ca chip-uri. Ordinea de aici e ordinea de pe ecran. */
export const CATEGORIES: Category[] = [
  { id: 'muzica', label: 'Muzică', icon: 'musical-notes-outline' },
  { id: 'teatru', label: 'Teatru', icon: 'happy-outline' },
  { id: 'film', label: 'Film', icon: 'film-outline' },
  { id: 'party', label: 'Party', icon: 'sparkles-outline' },
  { id: 'standup', label: 'Stand-up', icon: 'mic-outline' },
  { id: 'sport', label: 'Sport', icon: 'football-outline' },
  { id: 'social', label: 'Social', icon: 'people-outline' },
  { id: 'studenti', label: 'Studenți', icon: 'school-outline' },
];

/** Găsește o categorie după id. */
export function getCategory(id: CategoryId): Category {
  // `!` e sigur: fiecare CategoryId are o intrare în CATEGORIES.
  return CATEGORIES.find((c) => c.id === id)!;
}
