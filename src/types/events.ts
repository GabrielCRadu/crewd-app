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
  | 'ateliere'
  | 'sport'
  | 'social'
  | 'studenti';

/** Prețul unui eveniment, cum e anunțat de organizator. */
export interface EventPrice {
  isFree: boolean;
  /** În lei; null = necunoscut. */
  min: number | null;
  max: number | null;
  /** Textul afișat, ex. „80–120 lei” sau „Gratuit, cu înscriere”. */
  label: string;
  soldOut: boolean;
}

/** De unde provine evenimentul (atribuire obligatorie în interfață). */
export interface EventSource {
  name: string;
  url: string;
}

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
  /** Tag-uri folosite pentru preferințe; aceleași denumiri ca în profil (ex. „Concerte”, „Jazz”). */
  tags: string[];
  /** În Firestore sunt Timestamp; le transformăm în Date cu `.toDate()`. */
  startsAt: Date;
  endsAt: Date;
  /** true când organizatorul nu a anunțat ora de final și `endsAt` e estimat. */
  endsAtEstimated: boolean;
  /** Ex. „Accesul de la 20:00, concertul începe la 21:00”. */
  timeNote: string | null;
  venueName: string;
  address: string;
  /** În Firestore: GeoPoint. */
  location: LatLng;
  /** Link către afiș (poate fi gol). */
  imageUrl: string;
  /** Cui aparține imaginea (atribuire). */
  imageCredit: string | null;
  /** Preț minim în lei. 0 = gratuit, null = necunoscut. Detaliile sunt în `priceInfo`. */
  price: number | null;
  priceInfo: EventPrice | null;
  organizer: string | null;
  /** Ex. „18+”. */
  ageRestriction: string | null;
  /** Unde se cumpără bilete sau unde te înscrii. */
  ticketUrl: string | null;
  source: EventSource | null;
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
  /** Scor per tag, ex. { Concerte: 3, Teatru: 1 }. Cu cât e mai mare, cu atât îi place mai mult. */
  tagScores: Record<string, number>;
  /** Id-urile evenimentelor la care s-a înscris. */
  joinedEventIds: string[];
}
