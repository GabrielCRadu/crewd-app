import { colors } from './colors';

/** Umbră fină pentru carduri. iOS folosește shadow*, Android folosește elevation. */
export const cardShadow = {
  shadowColor: colors.text,
  shadowOpacity: 0.08,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 3,
} as const;
