import type { Gender } from '../types/user';

/** Ecranele de autentificare (înainte de login). */
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  /** Documentele pe care le accepți la crearea contului. */
  Terms: undefined;
  PrivacyPolicy: undefined;
};

/** Ce se completează la pasul 1 din onboarding și se trimite la pasul 2. */
export interface IdentityDraft {
  name: string;
  /** „AAAA-LL-ZZ” */
  birthDate: string;
  city: string;
  gender: Gender;
  /** Username-ul unic ales la pasul 1 (strict litere mici). */
  username: string;
}

/** Cei trei pași de onboarding (după crearea contului, înainte de tab-uri): identitate, poză, tag-uri. */
export type OnboardingStackParamList = {
  /** `takenUsername`: username-ul care s-a dovedit luat la salvare (revenire de la ultimul pas). */
  OnboardingIdentity: { takenUsername?: string } | undefined;
  OnboardingPhoto: { identity: IdentityDraft };
  OnboardingTags: { identity: IdentityDraft; photoUrl: string };
};
