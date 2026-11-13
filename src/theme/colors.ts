/**
 * Paleta aplicației, după docs/design-language.md:
 * fundal aproape negru, suprafețe de sticlă translucide, text alb, accente calde.
 */
export const colors = {
  /** Fundalul tuturor ecranelor. */
  background: '#0B0A10',
  /** Fundal secundar (violet foarte închis), pentru zone mari. */
  backgroundAlt: '#1A1424',
  /** Suprafață de sticlă: carduri, liste, bare. */
  card: 'rgba(255,255,255,0.08)',
  /** Sticlă mai opacă: elemente apăsate sau peste poze/hartă. */
  cardStrong: 'rgba(255,255,255,0.14)',
  /** Suprafață opacă închisă, pentru carduri peste hartă (unde sticla nu se citește bine). */
  surface: '#1C1726',
  /** Conturul subțire al sticlei. */
  border: 'rgba(255,255,255,0.12)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.62)',
  faint: 'rgba(255,255,255,0.40)',
  /** Text pe elemente deschise (pastila albă, CTA-ul cu gradient). */
  onLight: '#1A1424',
  /** Accentul principal (roz din gradientul aurora). */
  primary: '#FF4D8D',
  accentYellow: '#FFC94D',
  accentOrange: '#FF7A3D',
  accentPink: '#FF4D8D',
  accentMagenta: '#C13CFF',
  like: '#2ECC71',
  nope: '#FF5C5C',
};
