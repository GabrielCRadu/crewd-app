import type { IconName } from './events';

/** Tag-urile pozitive pe care le poți da cuiva după un eveniment. */
export type RatingTag = 'friendly' | 'punctual' | 'again';

export interface RatingTagInfo {
  id: RatingTag;
  label: string;
  icon: IconName;
}

/** Ce ai dat tu unei persoane la un eveniment: tag-uri pozitive sau un raport (nu ambele). */
export interface PersonRating {
  tags: RatingTag[];
  reported: boolean;
}

/** Evaluările tale de la un eveniment: personId → evaluare. */
export type EventRatings = Record<string, PersonRating>;

/**
 * Ce se vede pe profilul unei persoane: doar totalurile.
 * Nu se păstrează aici cine a dat ce, ca evaluările și rapoartele să rămână anonime.
 */
export interface Reputation {
  tagCounts: Record<RatingTag, number>;
  reportsCount: number;
}
