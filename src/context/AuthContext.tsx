import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import { MY_PROFILE } from '../data/mockSocial';
import { isFirebaseConfigured } from '../lib/firebase';
import { confirmPassword, deleteCurrentUser, signOut as authSignOut, subscribeToAuth } from '../services/authService';
import { leaveAllGroups } from '../services/groupsService';
import type { AuthUser } from '../services/authService';
import { loadUserPreferences, seedTagScores } from '../services/preferencesService';
import {
  createProfile,
  deleteProfile,
  getProfile,
  getSavedPreferences,
  setBio,
  setLearnedTags,
  updateProfileFields,
} from '../services/profileService';
import type { ProfileChanges, ProfileDraft, UserProfile } from '../types/user';

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
  updateBio: (bio: string) => Promise<void>;
  /** Salvează modificările din „Editează profilul”. */
  updateProfile: (changes: ProfileChanges) => Promise<void>;
  removeLearnedTag: (tag: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Șterge definitiv contul: confirmă parola, iese din grupulețe, șterge profilul și contul. */
  deleteAccount: (password: string) => Promise<void>;
  retry: () => void;
}

const DEMO_PROFILE: UserProfile = {
  uid: 'demo',
  name: MY_PROFILE.name,
  birthDate: null,
  age: MY_PROFILE.age,
  city: MY_PROFILE.city,
  gender: 'other',
  bio: MY_PROFILE.bio,
  photoUrl: null,
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
        loadUserPreferences(null, null, []);
        setStatus('signedOut');
        return;
      }
      setStatus('loading');
      try {
        const loaded = await getProfile(nextUser.uid);
        // Înscrierile și scorurile salvate se încarcă o singură dată, la login.
        const saved = loaded ? await getSavedPreferences(nextUser.uid) : null;
        if (!active) return;
        if (loaded) loadUserPreferences(nextUser.uid, saved, allProfileTags(loaded));
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

  // Fără Firebase (profil demo): scorurile pornesc o dată de la tag-urile profilului demo.
  useEffect(() => {
    if (!isFirebaseConfigured) seedTagScores(allProfileTags(DEMO_PROFILE));
  }, []);

  const completeOnboarding = useCallback(
    async (draft: ProfileDraft) => {
      if (!user) throw new Error('Nu ești logat.');
      const created = await createProfile(user.uid, draft);
      loadUserPreferences(user.uid, null, allProfileTags(created));
      setProfile(created);
      setStatus('ready');
    },
    [user],
  );

  const updateBio = useCallback(
    async (bio: string) => {
      if (!profile) return;
      const previous = profile.bio;
      setProfile({ ...profile, bio });
      if (!isFirebaseConfigured) return;
      try {
        await setBio(profile.uid, bio);
      } catch (e) {
        setProfile((p) => (p ? { ...p, bio: previous } : p));
        throw e;
      }
    },
    [profile],
  );

  // „Editează profilul”: actualizăm imediat pe ecran; dacă salvarea în Firestore eșuează, revenim.
  const updateProfile = useCallback(
    async (changes: ProfileChanges) => {
      if (!profile) return;
      const previous = profile;
      setProfile({ ...profile, ...changes });
      if (!isFirebaseConfigured) return;
      try {
        await updateProfileFields(profile.uid, changes);
      } catch (e) {
        setProfile(previous);
        throw e;
      }
    },
    [profile],
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

  const deleteAccount = useCallback(
    async (password: string) => {
      if (!isFirebaseConfigured || !user) throw new Error('Ștergerea contului merge doar cu un cont real.');
      // Întâi parola: dacă e greșită, nu se șterge nimic.
      await confirmPassword(password);
      await leaveAllGroups(user.uid);
      await deleteProfile(user.uid);
      // Ultimul pas: contul din Firebase Auth. După el, sesiunea se închide și apare ecranul de login.
      await deleteCurrentUser();
    },
    [user],
  );

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(
    () => ({ status, user, profile, error, completeOnboarding, updateBio, updateProfile, removeLearnedTag, signOut, deleteAccount, retry }),
    [status, user, profile, error, completeOnboarding, updateBio, updateProfile, removeLearnedTag, signOut, deleteAccount, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth() trebuie folosit în interiorul <AuthProvider>.');
  return value;
}
