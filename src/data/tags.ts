import type { TagGroup } from '../types/social';
import { tr } from '../i18n';

/** Tag-urile de pornire din onboarding și profil (vezi docs/layout-guide.md). */
export const TAG_GROUPS: TagGroup[] = [
  { id: 'events', get label() { return tr('Tipuri de evenimente'); }, tags: ['Concerte', 'Party-uri', 'Teatru', 'Socializare'] },
  { id: 'music', get label() { return tr('Muzică'); }, tags: ['Rock', 'Electronică', 'Hip-hop', 'Jazz', 'Pop', 'Folk'] },
  { id: 'hobbies', get label() { return tr('Hobby-uri'); }, tags: ['Board games', 'Drumeții', 'Fotografie', 'Gaming', 'Sport', 'Gătit'] },
];
