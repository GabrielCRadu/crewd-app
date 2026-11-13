import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { MY_PROFILE } from '../data/mockSocial';
import { isFirebaseConfigured } from '../lib/firebase';
import { signOut as authSignOut, subscribeToAuth } from '../services/authService';
import type { AuthUser } from '../services/authService';
import { seedTagScores } from '../services/preferencesService';
import { createProfile, getProfile, setLearnedTags } from '../services/profileService';
import type { ProfileDraft, UserProfile } from '../types/user';

/*
 * Starea de autentificare pentru toată aplicația:
 * - loading:       verificăm sesiunea salvată
 * - signedOut:     ecranele de login / creare cont
 * - needsProfile:  logat, dar fără profil → onboarding
 * - ready:         tab-urile
 * Fără Firebase configurat (.env.local lipsă) sărim direct la `ready`, cu profilul mock.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'ready';

interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  profile: UserProfile | null;
  /** Mesaj dacă profilul nu s-a putut încărca (ex. fără internet). */
  error: string | null;
  completeOnboarding: (draft: ProfileDraft) => Promise<void>;
  removeLearnedTag: (tag: string) => Promise<void>;
  signOut: () => Promise<void>;
  retry: () => void;
}

const DEMO_PROFILE: UserProfile = {
  uid: 'demo',
  name: MY_PROFILE.name,
  age: MY_PROFILE.age,
  city: MY_PROFILE.city,
  gender: 'other',
  chosenTags: MY_PROFILE.chosenTags,
  learnedTags: MY_PROFILE.learnedTags,
};

/** Toate tag-urile profilului (alese + învățate), ca listă. */
export function allProfileTags(profile: UserProfile | null): string[] {
  if (!profile) return [];
  const { events, music, hobbies } = profile.chosenTags;
  return [...events, ...music, ...hobbies, ...profile.learnedTags];
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(isFirebaseConfigured ? null : DEMO_PROFILE);
  const [status, setStatus] = useState<AuthStatus>(isFirebaseConfigured ? 'loading' : 'ready');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let active = true;
    const unsubscribe = subscribeToAuth(async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setError(null);
      if (!nextUser) {
        setProfile(null);
        setStatus('signedOut');
        return;
      }
      setStatus('loading');
      try {
        const loaded = await getProfile(nextUser.uid);
        if (!active) return;
        setProfile(loaded);
        setStatus(loaded ? 'ready' : 'needsProfile');
      } catch (e) {
        console.warn('Nu am putut încărca profilul:', e);
        if (active) setError('Nu am putut încărca profilul. Verifică conexiunea la internet.');
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  // Preferințele (scorurile tag-urilor) pornesc de la tag-urile din profil.
  useEffect(() => {
    if (profile) seedTagScores(allProfileTags(profile));
  }, [profile]);

  const completeOnboarding = useCallback(
    async (draft: ProfileDraft) => {
      if (!user) throw new Error('Nu ești logat.');
      const created = await createProfile(user.uid, draft);
      setProfile(created);
      setStatus('ready');
    },
    [user],
  );

  const removeLearnedTag = useCallback(
    async (tag: string) => {
      if (!profile) return;
      const learnedTags = profile.learnedTags.filter((t) => t !== tag);
      setProfile({ ...profile, learnedTags });
      if (isFirebaseConfigured) await setLearnedTags(profile.uid, learnedTags);
    },
    [profile],
  );

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured) await authSignOut();
  }, []);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(
    () => ({ status, user, profile, error, completeOnboarding, removeLearnedTag, signOut, retry }),
    [status, user, profile, error, completeOnboarding, removeLearnedTag, signOut, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth() trebuie folosit în interiorul <AuthProvider>.');
  return value;
}
