import { colors } from './colors';

/**
 * Tipografia stilului monocrom (docs/design-language.md), după profilul persoanei:
 * titluri mari și grele, etichete mici cu majuscule și litere spațiate (aspect editorial, sobru).
 */
export const type = {
  /** Etichete de secțiune și de câmp. */
  label: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: colors.muted,
  },
  /** Greutatea și spațierea titlurilor de ecran (mărimea rămâne a fiecărui ecran). */
  screenTitle: { fontWeight: '800', letterSpacing: -1, color: colors.text },
} as const;
