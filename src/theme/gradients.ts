import { isDark } from './colors';

/**
 * „Gradienturile” aplicației, în stil monocrom (docs/design-language.md): fără culori calde.
 * Numele rămân din varianta veche, ca ecranele să nu se schimbe; valorile sunt neutre.
 * expo-linear-gradient cere cel puțin două culori, de aceea unele au două valori identice.
 * Urmează tema telefonului (vezi colors.ts); umbririle peste poze sunt aceleași în ambele teme.
 */
const NONE = 'rgba(0,0,0,0)';
const SOFT = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';
const SOFTER = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
const SOLID = isDark ? '#FFFFFF' : '#0A0A0A';

export const gradients = {
  /** Butonul principal (CTA): pastilă plină (albă pe tema închisă, neagră pe cea deschisă). */
  cta: [SOLID, SOLID] as const,
  /** Locul unei poze lipsă: gri discret. */
  aurora: isDark
    ? (['#1E1E1E', '#141414', '#0E0E0E', '#0A0A0A'] as const)
    : (['#EDEDED', '#F2F2F2', '#F5F5F5', '#F7F7F7'] as const),
  /** Umbrire de jos în sus, ca textul peste poze să fie lizibil. */
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'] as const,
  /** Umbrire scurtă de sus în jos, ca badge-urile de deasupra unei poze să se citească (Cami). */
  scrimTop: ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'] as const,
  /** Avatare cu inițiale: gri. */
  avatar: isDark ? (['#3A3A3A', '#242424'] as const) : (['#E4E4E4', '#D6D6D6'] as const),
  /** Fosta lumină caldă de sus: dezactivată (fundal simplu). */
  screenGlowWarm: [NONE, NONE] as const,
  screenGlowCool: [NONE, NONE] as const,
  /** Fostele nuanțe calde ale cardurilor de listă: neutre. */
  cardTints: [
    [SOFT, SOFTER],
    [SOFT, SOFTER],
    [SOFT, SOFTER],
    [SOFT, SOFTER],
  ] as const,
  /** Fostele carduri colorate (ex. „Despre mine”, „Ce îți place”): neutre. */
  tintWarm: [SOFT, SOFTER] as const,
  tintCool: [SOFT, SOFTER] as const,
  /** Conturul cardurilor (GradientBorderCard): fin, alb pe tema închisă, negru pe cea deschisă. */
  cardBorder: isDark
    ? (['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)'] as const)
    : (['rgba(0,0,0,0.14)', 'rgba(0,0,0,0.14)'] as const),
};
