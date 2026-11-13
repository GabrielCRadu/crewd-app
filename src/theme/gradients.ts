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
  /**
   * Lumina caldă din partea de sus a ecranelor, care se stinge în fundalul negru.
   * Două straturi diagonale: portocaliu din stânga sus, roz-magenta din dreapta sus.
   */
  screenGlowWarm: ['rgba(255,122,61,0.55)', 'rgba(255,77,141,0.18)', 'rgba(11,10,16,0)'] as const,
  screenGlowCool: ['rgba(193,60,255,0.45)', 'rgba(255,77,141,0.15)', 'rgba(11,10,16,0)'] as const,
  /**
   * Nuanțe calde foarte discrete pentru cardurile de listă (mult mai slabe decât aurora):
   * accentul la ~20% opacitate în stânga, care se stinge spre dreapta.
   */
  cardTints: [
    ['rgba(255,122,61,0.22)', 'rgba(255,122,61,0.03)'], // portocaliu
    ['rgba(255,77,141,0.22)', 'rgba(255,77,141,0.03)'], // roz
    ['rgba(193,60,255,0.24)', 'rgba(193,60,255,0.03)'], // magenta
    ['rgba(255,201,77,0.18)', 'rgba(255,201,77,0.03)'], // galben
  ] as const,
  /**
   * Nuanțe mai puternice, pentru câteva carduri evidențiate pe un ecran altfel complet negru
   * (ex. „Despre mine” și „Ce îți place” din Profil). Diagonal, din stânga sus.
   */
  tintWarm: ['rgba(255,122,61,0.38)', 'rgba(255,77,141,0.16)', 'rgba(255,77,141,0.04)'] as const,
  tintCool: ['rgba(193,60,255,0.36)', 'rgba(255,77,141,0.14)', 'rgba(255,77,141,0.04)'] as const,
  /** Conturul colorat al cardurilor cu interior negru (GradientBorderCard). */
  cardBorder: [colors.accentOrange, colors.accentPink, colors.accentMagenta] as const,
};
