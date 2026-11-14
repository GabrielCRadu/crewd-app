import type { TagGroup } from './social';

export type Gender = 'female' | 'male' | 'other';

/**
 * Profilul utilizatorului, completat la onboarding.
 * În Firestore: documentul users/{uid} (vezi docs/firebase.md).
 */
export interface UserProfile {
  uid: string;
  name: string;
  /**
   * Data nașterii, „AAAA-LL-ZZ”. Aleasă la onboarding și blocată după (regulile Firestore).
   * null doar la profilurile vechi, create cu vârsta în loc de dată.
   */
  birthDate: string | null;
  /** Vârsta în ani, calculată din `birthDate` (nu se salvează). */
  age: number;
  city: string;
  /** Blocat după onboarding (regulile Firestore). */
  gender: Gender;
  /** „Despre mine”, scris de utilizator din Profil. Poate fi gol. */
  bio: string;
  /**
   * Fotografia de profil ca data URI JPEG mic (~400px, câțiva zeci de KB), salvat direct în documentul
   * din Firestore. null = fără poză (se afișează inițiala). Mai târziu se poate muta în Firebase Storage.
   */
  photoUrl: string | null;
  /**
   * Miniatura aceleiași poze (~96px, data URI JPEG de câțiva KB), copiată în grupuri (`members[uid].photo`)
   * ca ceilalți membri să o vadă în chat fără acces la profil. Lipsește la profilurile de dinainte de chat.
   */
  photoThumb?: string | null;
  /** Tag-urile alese la onboarding, pe grupuri (src/data/tags.ts). */
  chosenTags: Record<TagGroup['id'], string[]>;
  /** Tag-uri adăugate automat din evenimentele la care s-a înscris. */
  learnedTags: string[];
}

/** Ce se completează în onboarding (restul câmpurilor le pune aplicația). */
export type ProfileDraft = Omit<UserProfile, 'uid' | 'learnedTags' | 'bio' | 'photoUrl' | 'photoThumb' | 'age'> & { birthDate: string };

/** Ce se poate schimba din „Editează profilul”. */
/** Data nașterii și genul NU se pot schimba după onboarding. */
export type ProfileChanges = Partial<Pick<UserProfile, 'name' | 'city' | 'bio' | 'photoUrl' | 'photoThumb' | 'chosenTags'>>;
