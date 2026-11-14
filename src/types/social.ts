import type { LatLng } from './events';
import type { Gender } from './user';

/** Un grup de tag-uri afișat ca secțiune (ex. „Muzică”). */
export interface TagGroup {
  id: 'events' | 'music' | 'hobbies';
  label: string;
  tags: string[];
}

/** O persoană din tab-ul Descoperă. */
export interface Person {
  id: string;
  name: string;
  age: number;
  distanceKm: number;
  tags: string[];
  /** Evenimentul la care merge și ea/el, dacă există. */
  goingTo: { title: string; when: string } | null;
  /** Orașul, afișat pe profilul persoanei. */
  city?: string;
  /** „Despre”, scris de persoană. */
  bio?: string;
  /** Fotografia de profil (URL). Lipsă = se afișează inițiala. */
  photoUrl?: string;
  /** Username-ul unic (persoanele de test îl primesc din nume, în src/data/mockSocial.ts). */
  username?: string;
  /** Genul ales de persoană în profilul ei; după el alegem „prietena” / „prietenul” în texte. */
  gender?: Gender;
}

/** Un prieten afișat pe hartă. */
export interface Friend {
  id: string;
  name: string;
  /**
   * Mock: poziția e dată ca decalaj (în grade) față de locația dispozitivului,
   * ca prietenii să apară mereu în jurul tău. Cu date reale va fi o LatLng absolută.
   */
  offset: LatLng;
  /** Ce face acum, ex. „La Hamlet, acum”. */
  status: string;
}

/** Profilul utilizatorului curent. */
export interface Profile {
  name: string;
  age: number;
  city: string;
  /** Descrierea scrisă de utilizator („Despre mine”). Poate fi goală. */
  bio: string;
  /** Tag-urile alese la onboarding, pe grupuri. */
  chosenTags: Record<TagGroup['id'], string[]>;
  /** Tag-uri adăugate automat din evenimentele la care s-a înscris. */
  learnedTags: string[];
}

/** Un grup de chat (al tău sau sugerat). */
export interface ChatGroup {
  id: string;
  name: string;
  eventTitle: string;
  membersCount: number;
  commonTagsCount: number;
  /** Ex. „azi la 19:45”. */
  meetupWhen: string;
  /** Ex. „în fața intrării”. */
  meetupWhere: string;
  lastMessage: { author: string; text: string; time: string } | null;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  /** null = mesajul utilizatorului curent. */
  author: string | null;
  text: string;
}
