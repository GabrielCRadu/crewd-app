import type { Gender } from '../types/user';

/** Ecranele de autentificare (înainte de login). */
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
};

/** Ce se completează la pasul 1 din onboarding și se trimite la pasul 2. */
export interface IdentityDraft {
  name: string;
  /** „AAAA-LL-ZZ” */
  birthDate: string;
  city: string;
  gender: Gender;
}

/** Cei doi pași de onboarding (după crearea contului, înainte de tab-uri). */
export type OnboardingStackParamList = {
  OnboardingIdentity: undefined;
  OnboardingTags: { identity: IdentityDraft };
};
