/**
 * Paleta aplicației, după docs/design-language.md: stil monocrom.
 * Negru, gri și alb; culoarea o dau pozele, nu interfața. Excepții: erori (roșu) și distanțe pe hartă.
 */
export const colors = {
  /** Fundalul tuturor ecranelor: negru simplu. */
  background: '#000000',
  /** Fundal secundar (gri foarte închis), pentru zone mari și locul pozelor care lipsesc. */
  backgroundAlt: '#111111',
  /** Card neutru: gri închis translucid. */
  card: 'rgba(255,255,255,0.07)',
  /** Card mai deschis: elemente apăsate sau peste poze/hartă. */
  cardStrong: 'rgba(255,255,255,0.13)',
  /** Suprafață opacă închisă, pentru carduri peste hartă. */
  surface: '#161616',
  /** Conturul fin al cardurilor. */
  border: 'rgba(255,255,255,0.12)',
  /** Întunecarea din spatele unei foi de jos (restul ecranului rămâne vizibil, dar estompat). */
  backdrop: 'rgba(0,0,0,0.6)',
  text: '#FFFFFF',
  muted: 'rgba(255,255,255,0.62)',
  faint: 'rgba(255,255,255,0.40)',
  /** Text pe elemente albe (pastila albă, butonul principal). */
  onLight: '#0A0A0A',
  /** Accentul principal: alb (stil monocrom; culoarea o dau pozele, nu interfața). */
  primary: '#FFFFFF',
  /** Tonuri de gri (fostele accente calde), pentru elementele care încă le folosesc. */
  accentYellow: '#D9D9D9',
  accentOrange: '#A6A6A6',
  accentPink: '#8C8C8C',
  accentMagenta: '#6E6E6E',
  /** Singurele culori păstrate, pentru că transmit informație: confirmare și eroare. */
  like: '#2ECC71',
  nope: '#FF5C5C',
  /** Distanța până la un eveniment (pini pe hartă, bulina din liste): aproape / mediu / departe. */
  distanceNear: '#2ECC71',
  distanceMedium: '#FFC94D',
  distanceFar: '#FF5C5C',
};

/** Tag-uri evidențiate (stil monocrom: fundal gri ușor + contur alb fin). Numele cheilor rămân din varianta colorată. */
export const tagTints = {
  orange: { background: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.22)' },
  pink: { background: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.22)' },
  magenta: { background: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.22)' },
};

export type TagTint = (typeof tagTints)[keyof typeof tagTints];
