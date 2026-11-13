import type { RatingTagInfo } from '../types/ratings';

/** Cele trei tag-uri de după eveniment, în ordinea în care apar. */
export const RATING_TAGS: RatingTagInfo[] = [
  { id: 'friendly', label: 'De treabă', icon: 'happy-outline' },
  { id: 'punctual', label: 'Punctual', icon: 'time-outline' },
  { id: 'again', label: 'Aș mai ieși cu el/ea', icon: 'repeat-outline' },
];
