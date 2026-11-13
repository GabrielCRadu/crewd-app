/*
 * Stilul tab-ului Evenimente, după macheta din PDF:
 * fundal crem, contururi bleumarin groase, umbre „tari” fără blur,
 * coral pentru acțiuni principale și galben pentru ce e selectat.
 *
 * E separat de colors.ts (tema închisă a restului aplicației), ca să nu
 * schimbăm ecranele celorlalte tab-uri.
 */

/** Culorile din machetă. */
export const palette = {
  background: '#FFF2C4', // crem
  card: '#FFFFFF',
  ink: '#1B1740', // bleumarin: text, contururi, umbre
  muted: '#4E4A6B',
  coral: '#FF6B5B',
  yellow: '#FFD43B',
  green: '#22B07D',
};

/** Fonturile (încărcate în EventsNavigator). */
export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold', // titluri mari
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

export const ui = {
  /** Conturul elementelor (carduri, butoane, chip-uri). */
  outline: palette.ink,
  outlineWidth: 2,
  /** Umbra „tare”: un bloc decalat în spatele elementului. */
  shadow: palette.ink,
  shadowOffset: 4,
  radius: 20,
  /** Chip-uri / opțiuni selectate: galben cu text bleumarin. */
  selected: palette.yellow,
  /** Butoanele principale și cardul „ACUM”: coral cu text bleumarin. */
  cta: palette.coral,
  /** Fundalul pentru imagini care încă se încarcă (ca „[FOTO]” din machetă). */
  placeholder: palette.coral,
};
