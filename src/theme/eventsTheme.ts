import { colors } from './colors';

/*
 * Stilul tab-ului Evenimente, după macheta din PDF (contururi groase,
 * umbre „tari” fără blur, chip-uri rotunde), dar cu paleta închisă din colors.ts.
 */

/** Fonturile (încărcate în EventsNavigator). */
export const fonts = {
  display: 'BricolageGrotesque_800ExtraBold', // titluri mari
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
};

export const ui = {
  /** Conturul elementelor (cardurile, butoanele, chip-urile). */
  outline: '#4A4A66',
  outlineWidth: 2,
  /** Umbra „tare”: un bloc decalat în spatele elementului. */
  shadow: '#000000',
  shadowOffset: 4,
  radius: 20,
  /** Culoarea de accent (chip-uri selectate, butonul principal) și textul de pe ea. */
  accent: colors.primary,
  onAccent: colors.background,
  /** Cardul „ACUM” (în PDF e coral; aici roșul din colors.ts). */
  live: colors.nope,
  onLive: colors.background,
};
