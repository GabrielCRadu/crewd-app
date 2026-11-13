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
  /** „Despre mine”, scris de utilizator din Profil. Poate fi gol. */
  bio: string;
  /**
   * Fotografia de profil ca data URI JPEG mic (~400px, câțiva zeci de KB), salvat direct în documentul
   * din Firestore. null = fără poză (se afișează inițiala). Mai târziu se poate muta în Firebase Storage.
   */
  photoUrl: string | null;
  /** Tag-urile alese la onboarding, pe grupuri (src/data/tags.ts). */
  chosenTags: Record<TagGroup['id'], string[]>;
  /** Tag-uri adăugate automat din evenimentele la care s-a înscris. */
  learnedTags: string[];
}

/** Ce se completează în onboarding (restul câmpurilor le pune aplicația). */
export type ProfileDraft = Omit<UserProfile, 'uid' | 'learnedTags' | 'bio' | 'photoUrl'>;

/** Ce se poate schimba din „Editează profilul”. */
export type ProfileChanges = Partial<Pick<UserProfile, 'name' | 'age' | 'city' | 'bio' | 'photoUrl' | 'chosenTags'>>;
