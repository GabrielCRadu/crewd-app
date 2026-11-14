import { colors, onThemeChange } from './colors';

/**
 * Tipografia stilului monocrom (docs/design-language.md), după profilul persoanei:
 * titluri mari și grele, etichete mici cu majuscule și litere spațiate (aspect editorial, sobru).
 * Culorile se refac la schimbarea temei.
 */
export const type = {
  /** Etichete de secțiune și de câmp. */
  label: {
    fontSize: 12,
    fontWeight: '700' as const,
    letterSpacing: 1.6,
    textTransform: 'uppercase' as const,
    color: colors.muted,
  },
  /** Greutatea și spațierea titlurilor de ecran (mărimea rămâne a fiecărui ecran). */
  screenTitle: { fontWeight: '800' as const, letterSpacing: -1, color: colors.text },
};

onThemeChange(() => {
  type.label.color = colors.muted;
  type.screenTitle.color = colors.text;
});
