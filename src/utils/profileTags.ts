import type { UserProfile } from '../types/user';

/** Toate tag-urile profilului (alese + învățate), ca listă. */
export function allProfileTags(profile: UserProfile | null): string[] {
  if (!profile) return [];
  const { events, music, hobbies } = profile.chosenTags;
  return [...events, ...music, ...hobbies, ...profile.learnedTags];
}
