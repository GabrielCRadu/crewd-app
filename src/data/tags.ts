import type { TagGroup } from '../types/social';

/** Tag-urile de pornire din onboarding și profil (vezi docs/layout-guide.md). */
export const TAG_GROUPS: TagGroup[] = [
  { id: 'events', label: 'Tipuri de evenimente', tags: ['Concerte', 'Party-uri', 'Teatru', 'Socializare'] },
  { id: 'music', label: 'Muzică', tags: ['Rock', 'Electronică', 'Hip-hop', 'Jazz', 'Pop', 'Folk'] },
  { id: 'hobbies', label: 'Hobby-uri', tags: ['Board games', 'Drumeții', 'Fotografie', 'Gaming', 'Sport', 'Gătit'] },
];
