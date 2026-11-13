import type { tagTints } from '../theme/colors';
import type { IconName } from '../types/events';
import type { TagGroup } from '../types/social';

/** Iconița și culoarea tag-urilor fiecărui grup (cardul „Ce îți place” și „Editează profilul”). */
export const TAG_GROUP_STYLE: Record<TagGroup['id'], { icon: IconName; tint: keyof typeof tagTints }> = {
  events: { icon: 'ticket-outline', tint: 'orange' },
  music: { icon: 'musical-notes-outline', tint: 'magenta' },
  hobbies: { icon: 'color-palette-outline', tint: 'pink' },
};
