import { colors } from './colors';

/** Gradienturile din docs/design-language.md (pentru expo-linear-gradient). */
export const gradients = {
  /** Butonul principal (CTA): pastilă deschisă, alb → roz-lavandă. */
  cta: ['#FFFFFF', '#F3A6E8'] as const,
  /** Lumina caldă „aurora”, de la centru spre margini. */
  aurora: [colors.accentYellow, colors.accentOrange, colors.accentPink, colors.accentMagenta] as const,
  /** Umbrire de jos în sus, ca textul peste poze/aurora să fie lizibil. */
  scrim: ['rgba(11,10,16,0)', 'rgba(11,10,16,0.85)'] as const,
  /** Avatare cu inițiale. */
  avatar: [colors.accentOrange, colors.accentMagenta] as const,
};
