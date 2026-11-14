import type { RatingTagInfo } from '../types/ratings';
import { tr } from '../i18n';

/** Cele trei tag-uri de după eveniment, în ordinea în care apar. */
export const RATING_TAGS: RatingTagInfo[] = [
  { id: 'friendly', get label() { return tr('De treabă'); }, icon: 'happy-outline' },
  { id: 'punctual', get label() { return tr('Punctual'); }, icon: 'time-outline' },
  { id: 'again', get label() { return tr('Aș mai ieși cu el/ea'); }, icon: 'repeat-outline' },
];
