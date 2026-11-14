import { Appearance } from 'react-native';

/**
 * Paleta aplicației, după docs/design-language.md: stil monocrom.
 * Negru, gri și alb; culoarea o dau pozele, nu interfața. Excepții: erori (roșu) și distanțe pe hartă.
 *
 * Tema (închisă / deschisă) se poate schimba din mers (Setări → Temă, vezi src/theme/themeChoice.ts):
 * `applyColorScheme` înlocuiește valorile din `colors` (și din `tagTints`), apoi anunță modulele
 * care și-au construit stilurile din ele (`onThemeChange`), ca să le refacă. Numele culorilor sunt
 * aceleași în ambele teme, deci ecranele nu știu ce temă e activă.
 *
 * Reguli pentru cod nou:
 * - folosește `colors.x` / `glass` / `type` / `gradients` în StyleSheet-uri construite ca restul
 *   ecranelor (`let styles = makeStyles(); onThemeChange(() => { styles = makeStyles(); });`)
 *   sau direct la randare;
 * - pentru tema activă citește `appearance.isDark` / `appearance.scheme` la randare.
 */

export type ColorScheme = 'light' | 'dark';

const dark = {
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
  /** Text pe elementele „pline” (pastila albă, butonul principal). */
  onLight: '#0A0A0A',
  /** Text secundar pe elementele „pline” (ex. ora pe bula albă a mesajelor tale). */
  onLightMuted: 'rgba(10,10,10,0.5)',
  /** Accentul principal: alb (stil monocrom; culoarea o dau pozele, nu interfața). */
  primary: '#FFFFFF',
};

/** Tema deschisă: aceleași roluri, inversate (fundal alb, text negru, pastila principală neagră). */
const light: typeof dark = {
  background: '#FFFFFF',
  backgroundAlt: '#F2F2F2',
  card: 'rgba(0,0,0,0.045)',
  cardStrong: 'rgba(0,0,0,0.09)',
  surface: '#FFFFFF',
  border: 'rgba(0,0,0,0.12)',
  backdrop: 'rgba(0,0,0,0.4)',
  text: '#0A0A0A',
  muted: 'rgba(10,10,10,0.6)',
  faint: 'rgba(10,10,10,0.4)',
  onLight: '#FFFFFF',
  onLightMuted: 'rgba(255,255,255,0.6)',
  primary: '#0A0A0A',
};

const darkTagTint = { background: 'rgba(255,255,255,0.08)', border: 'rgba(255,255,255,0.22)' };
const lightTagTint = { background: 'rgba(0,0,0,0.05)', border: 'rgba(0,0,0,0.18)' };

const initialScheme: ColorScheme = Appearance.getColorScheme() === 'light' ? 'light' : 'dark';

/** Tema activă acum (se schimbă cu `applyColorScheme`). Citește-o la randare, nu la încărcarea fișierului. */
export const appearance = {
  scheme: initialScheme as ColorScheme,
  isDark: initialScheme === 'dark',
};

export const colors = {
  ...(initialScheme === 'dark' ? dark : light),
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
  /**
   * Peste poze (afișe, sub umbrire închisă): la fel în ambele teme, ca textul să rămână
   * alb și lizibil și pe tema deschisă.
   */
  photo: {
    text: '#FFFFFF',
    muted: 'rgba(255,255,255,0.8)',
    faint: 'rgba(255,255,255,0.6)',
    /** Sticlă închisă pentru pastile și butoane peste poze. */
    glass: 'rgba(0,0,0,0.38)',
    glassBorder: 'rgba(255,255,255,0.2)',
    /** Pastila albă de acțiune peste poze și textul de pe ea. */
    pill: '#FFFFFF',
    onPill: '#0A0A0A',
    /** Fundalul cardurilor cu afiș, cât poza se încarcă sau lipsește. */
    placeholder: '#161616',
  },
  /** Codul QR: mereu negru pe alb, ca să-l citească orice cameră, pe ambele teme. */
  qr: { dark: '#0A0A0A', light: '#FFFFFF' },
};

/** Tag-uri evidențiate (stil monocrom: fundal gri ușor + contur fin). Numele cheilor rămân din varianta colorată. */
const initialTint = initialScheme === 'dark' ? darkTagTint : lightTagTint;
export const tagTints = {
  orange: { ...initialTint },
  pink: { ...initialTint },
  magenta: { ...initialTint },
};

export type TagTint = (typeof tagTints)[keyof typeof tagTints];

const listeners: (() => void)[] = [];

/**
 * Cheamă `listener` după fiecare schimbare de temă, ca să refaci ce ai construit din culori
 * (StyleSheet-uri, obiecte de stil). Ascultătorii rulează în ordinea în care s-au înregistrat:
 * întâi cei din src/theme (sticla, tipografia, gradienturile), apoi ecranele.
 */
export function onThemeChange(listener: () => void): void {
  listeners.push(listener);
}

/** Trece toată paleta pe tema dată și anunță modulele să-și refacă stilurile. */
export function applyColorScheme(scheme: ColorScheme): void {
  if (scheme === appearance.scheme) return;
  appearance.scheme = scheme;
  appearance.isDark = scheme === 'dark';
  Object.assign(colors, scheme === 'dark' ? dark : light);
  const tint = scheme === 'dark' ? darkTagTint : lightTagTint;
  Object.assign(tagTints.orange, tint);
  Object.assign(tagTints.pink, tint);
  Object.assign(tagTints.magenta, tint);
  listeners.forEach((listener) => listener());
}
