/** Cerințele parolei la crearea contului (spec 2026-11-14-username-parola-design.md). */
export interface PasswordChecks {
  length: boolean;
  lower: boolean;
  upper: boolean;
}

/** Lungimea minimă a parolei. */
export const MIN_PASSWORD_LENGTH = 8;

/** Rândurile din lista de cerințe de sub câmpul de parolă, în ordine. */
export const PASSWORD_RULES: { key: keyof PasswordChecks; label: string }[] = [
  { key: 'length', label: `Minim ${MIN_PASSWORD_LENGTH} caractere` },
  { key: 'lower', label: 'O literă mică' },
  { key: 'upper', label: 'O literă mare' },
];

/** Ce cerințe îndeplinește parola. */
export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= MIN_PASSWORD_LENGTH,
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
  };
}

/** Parola îndeplinește toate cerințele? */
export function isStrongPassword(password: string): boolean {
  const checks = passwordChecks(password);
  return checks.length && checks.lower && checks.upper;
}
