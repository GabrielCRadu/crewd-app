import { appearance, onThemeChange } from './colors';

/**
 * „Gradienturile” aplicației, în stil monocrom (docs/design-language.md): fără culori calde.
 * Numele rămân din varianta veche, ca ecranele să nu se schimbe; valorile sunt neutre.
 * expo-linear-gradient cere cel puțin două culori, de aceea unele au două valori identice.
 * Urmează tema activă (vezi colors.ts) și se refac la schimbarea ei; umbririle peste poze
 * sunt aceleași în ambele teme.
 */
type Colors2 = readonly [string, string];
type Colors4 = readonly [string, string, string, string];

function build(isDark: boolean) {
  const NONE = 'rgba(0,0,0,0)';
  const SOFT = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.035)';
  const SOFTER = isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.015)';
  const SOLID = isDark ? '#FFFFFF' : '#0A0A0A';
  const tint: Colors2 = [SOFT, SOFTER];
  return {
    /** Butonul principal (CTA): pastilă plină (albă pe tema închisă, neagră pe cea deschisă). */
    cta: [SOLID, SOLID] as Colors2,
    /** Locul unei poze lipsă: gri discret. */
    aurora: (isDark ? ['#1E1E1E', '#141414', '#0E0E0E', '#0A0A0A'] : ['#EDEDED', '#F2F2F2', '#F5F5F5', '#F7F7F7']) as Colors4,
    /** Umbrire de jos în sus, ca textul peste poze să fie lizibil. */
    scrim: ['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)'] as Colors2,
    /** Umbrire scurtă de sus în jos, ca badge-urile de deasupra unei poze să se citească (Cami). */
    scrimTop: ['rgba(0,0,0,0.55)', 'rgba(0,0,0,0)'] as Colors2,
    /** Avatare cu inițiale: gri. */
    avatar: (isDark ? ['#3A3A3A', '#242424'] : ['#E4E4E4', '#D6D6D6']) as Colors2,
    /** Fosta lumină caldă de sus: dezactivată (fundal simplu). */
    screenGlowWarm: [NONE, NONE] as Colors2,
    screenGlowCool: [NONE, NONE] as Colors2,
    /** Fostele nuanțe calde ale cardurilor de listă: neutre. */
    cardTints: [tint, tint, tint, tint] as readonly [Colors2, Colors2, Colors2, Colors2],
    /** Fostele carduri colorate (ex. „Despre mine”, „Ce îți place”): neutre. */
    tintWarm: tint,
    tintCool: tint,
    /** Conturul cardurilor (GradientBorderCard): fin, alb pe tema închisă, negru pe cea deschisă. */
    cardBorder: (isDark ? ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.18)'] : ['rgba(0,0,0,0.14)', 'rgba(0,0,0,0.14)']) as Colors2,
  };
}

export const gradients = build(appearance.isDark);

onThemeChange(() => {
  Object.assign(gradients, build(appearance.isDark));
});
