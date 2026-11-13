import { colors } from './colors';

/** Raze de colț, după docs/design-language.md. */
export const radii = {
  card: 26,
  /** Butoane-iconiță (pătrat rotunjit). */
  icon: 14,
  /** Casete mici în interiorul cardurilor. */
  inner: 16,
  pill: 999,
};

/** Stilul de bază pentru o suprafață de sticlă. */
export const glass = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
} as const;
