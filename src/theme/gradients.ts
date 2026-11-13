/**
 * „Gradienturile” aplicației, în stil monocrom (docs/design-language.md): fără culori calde.
 * Numele rămân din varianta veche, ca ecranele să nu se schimbe; valorile sunt neutre.
 * expo-linear-gradient cere cel puțin două culori, de aceea unele au două valori identice.
 */
const NONE = 'rgba(0,0,0,0)';
const SOFT = 'rgba(255,255,255,0.05)';
const SOFTER = 'rgba(255,255,255,0.02)';

export const gradients = {
  /** Butonul principal (CTA): pastilă albă plină, text închis. */
  cta: ['#FFFFFF', '#FFFFFF'] as const,
  /** Locul unei poze lipsă: gri închis, foarte discret. */
  aurora: ['#1E1E1E', '#141414', '#0E0E0E', '#0A0A0A'] as const,
  /** Umbrire de jos în sus, ca textul peste poze să fie lizibil. */
  scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'] as const,
  /** Umbrire scurtă de sus în jos, ca badge-urile de deasupra unei poze să se citească (Cami). */
  scrimTop: ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'] as const,
  /** Avatare cu inițiale: gri. */
  avatar: ['#3A3A3A', '#242424'] as const,
  /** Fosta lumină caldă de sus: dezactivată (fundal negru simplu). */
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
  /** Conturul cardurilor cu interior negru (GradientBorderCard): alb fin. */
  cardBorder: ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)'] as const,
};
