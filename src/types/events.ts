import type { ComponentProps } from 'react';
import type { Ionicons } from '@expo/vector-icons';

/** Numele unei iconițe din Ionicons (ex. 'musical-notes-outline'). */
export type IconName = ComponentProps<typeof Ionicons>['name'];

/** Coordonate geografice (același format ca react-native-maps și expo-location). */
export interface LatLng {
  latitude: number;
  longitude: number;
}

/** Id-urile categoriilor. Le folosim și ca valoare a câmpului `category` în Firestore. */
export type CategoryId =
  | 'muzica'
  | 'teatru'
  | 'film'
  | 'party'
  | 'standup'
  | 'sport'
  | 'social'
  | 'studenti';

export interface Category {
  id: CategoryId;
  label: string;
  icon: IconName;
}

/**
 * Un eveniment. În Firestore: colecția "events", câte un document per eveniment
 * (id-ul documentului = `id`).
 */
export interface Event {
  id: string;
  /** Numele afișat mare: artistul/trupa, piesa de teatru, filmul etc. */
  title: string;
  description: string;
  category: CategoryId;
  /** Tag-uri folosite pentru preferințe, ex. ["rock", "concert"]. */
  tags: string[];
  /** În Firestore vor fi Timestamp; le transformăm în Date cu `.toDate()`. */
  startsAt: Date;
  endsAt: Date;
  venueName: string;
  address: string;
  /** În Firestore: GeoPoint sau un obiect { latitude, longitude }. */
  location: LatLng;
  /** Link către afiș. */
  imageUrl: string;
  /** Preț în lei. 0 = gratuit, null = necunoscut. */
  price: number | null;
  /** Numele prietenilor care merg (mai târziu: calculat din lista de prieteni a utilizatorului). */
  friendsGoing: string[];
  /** Câte persoane caută cu cine să meargă. */
  lookingForCompanyCount: number;
}

/** Un eveniment + distanța (în km) față de utilizator, calculată în aplicație. */
export interface EventWithDistance extends Event {
  distanceKm: number;
}

/**
 * Preferințele utilizatorului. În Firestore: câmpuri în documentul users/{uid}.
 */
export interface UserPreferences {
  /** Scor per tag, ex. { rock: 3, teatru: 1 }. Cu cât e mai mare, cu atât îi place mai mult. */
  tagScores: Record<string, number>;
  /** Id-urile evenimentelor la care s-a înscris. */
  joinedEventIds: string[];
}

/** Ce fel de perioadă e selectată în PeriodPicker. */
export type PeriodKind = 'now' | 'today' | 'weekend' | 'week' | 'month';

/**
 * O perioadă de timp. `start` și `end` sunt timestamp-uri (milisecunde),
 * ca să poată fi trimise ca parametri de navigare.
 */
export interface Period {
  kind: PeriodKind;
  start: number;
  end: number;
  label: string;
}
