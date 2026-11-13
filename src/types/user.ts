import type { TagGroup } from './social';

export type Gender = 'female' | 'male' | 'other';

/**
 * Profilul utilizatorului, completat la onboarding.
 * În Firestore: documentul users/{uid} (vezi docs/firebase.md).
 */
export interface UserProfile {
  uid: string;
  name: string;
  age: number;
  city: string;
  gender: Gender;
  /** Tag-urile alese la onboarding, pe grupuri (src/data/tags.ts). */
  chosenTags: Record<TagGroup['id'], string[]>;
  /** Tag-uri adăugate automat din evenimentele la care s-a înscris. */
  learnedTags: string[];
}

/** Ce se completează în onboarding (restul câmpurilor le pune aplicația). */
export type ProfileDraft = Omit<UserProfile, 'uid' | 'learnedTags'>;
