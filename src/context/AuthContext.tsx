import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { MY_PROFILE } from '../data/mockSocial';
import { isFirebaseConfigured } from '../lib/firebase';
import { confirmPassword, deleteCurrentUser, signOut as authSignOut, subscribeToAuth } from '../services/authService';
import { MOCK_UID, leaveAllGroups, refreshMyPhotoInGroups } from '../services/groupsService';
import { makeThumbnail } from '../services/photoService';
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
import { isNewPhoto } from '../utils/profilePhoto';
import { isProfileComplete } from '../utils/profileCompleteness';
import { usernameFromName } from '../utils/usernameRules';
import { claimUsername, releaseUsername, updatePublicCard } from '../services/usernamesService';
import { deletePublicProfile, getPublicProfile, savePublicProfile } from '../services/publicProfileService';
import { publicProfileKey, toPublicProfile } from '../utils/publicProfile';
import { startFriendsSync, stopFriendsSync } from '../services/friendsService';
import { deleteMyFriendData } from '../services/friendshipsFirestore';
import { allProfileTags } from '../utils/profileTags';
import { tr } from '../i18n';

/*
 * Starea de autentificare pentru toată aplicația:
 * - loading:       verificăm sesiunea salvată
 * - signedOut:     ecranele de login / creare cont
 * - needsProfile:  logat, dar fără profil → onboarding
 * - needsCompletion: profil vechi fără username sau poză → „Completează-ți profilul”
 * - ready:         tab-urile
 * Fără Firebase configurat (.env.local lipsă) sărim direct la `ready`, cu profilul mock.
 */
export type AuthStatus = 'loading' | 'signedOut' | 'needsProfile' | 'needsCompletion' | 'ready';

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
  /** Conturile vechi: alege username-ul și/sau pune poza care lipsește, apoi intră în aplicație. */
  completeProfile: (parts: { username?: string; photoUrl?: string }) => Promise<void>;
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
  username: usernameFromName(MY_PROFILE.name),
};

/** Re-exportat de aici pentru ecranele care îl importă din context (definit în utils/profileTags.ts). */
export { allProfileTags };

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(isFirebaseConfigured ? null : DEMO_PROFILE);
  const [status, setStatus] = useState<AuthStatus>(isFirebaseConfigured ? 'loading' : 'ready');
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Amprenta ultimului profil public scris (src/utils/publicProfile.ts).
  const publishedKey = useRef<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let active = true;
    const unsubscribe = subscribeToAuth(async (nextUser) => {
      if (!active) return;
      setUser(nextUser);
      setError(null);
      if (!nextUser) {
        publishedKey.current = null;
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
        setStatus(loaded ? (isProfileComplete(loaded) ? 'ready' : 'needsCompletion') : 'needsProfile');
        // Profilurile cu poză de dinainte de chat n-au miniatură: o generăm o dată, în fundal.
        if (loaded?.photoUrl && !loaded.photoThumb) void backfillThumbnail(loaded.uid, loaded.photoUrl, loaded.username ?? null);
      } catch (e) {
        console.warn('Nu am putut încărca profilul:', e);
        if (active) setError(tr('Nu am putut încărca profilul. Verifică conexiunea la internet.'));
      }
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [attempt]);

  // Profilul public (profiles/{uid}) urmează profilul tău complet: se rescrie doar când diferă de ce e salvat
  // (așa îl primesc și conturile de dinainte, la primul login după actualizare).
  useEffect(() => {
    if (!isFirebaseConfigured || status !== 'ready' || !profile || !user || profile.uid !== user.uid) return;
    const pub = toPublicProfile(profile);
    const key = publicProfileKey(pub);
    if (key === publishedKey.current) return;
    // Prima dată după pornire comparăm cu ce e deja salvat, ca să nu retrimitem poza la fiecare pornire.
    const firstCheck = publishedKey.current === null;
    publishedKey.current = key;
    void (async () => {
      try {
        if (firstCheck) {
          const saved = await getPublicProfile(pub.uid);
          if (saved && publicProfileKey(saved) === key) return;
        }
        await savePublicProfile(pub);
      } catch (e) {
        publishedKey.current = null;
        console.warn('Nu am putut actualiza profilul public:', e);
      }
    })();
  }, [status, profile, user]);

  // Prieteniile conturilor reale se ascultă live cât ești logat cu profilul complet (friendsService.ts).
  const syncUid = isFirebaseConfigured && status === 'ready' && user ? user.uid : null;
  useEffect(() => {
    if (!syncUid) return;
    startFriendsSync(syncUid);
    return () => stopFriendsSync();
  }, [syncUid]);

  // Fără Firebase (profil demo): scorurile pornesc o dată de la tag-urile profilului demo.
  useEffect(() => {
    if (!isFirebaseConfigured) seedTagScores(allProfileTags(DEMO_PROFILE));
  }, []);

  const completeOnboarding = useCallback(
    async (draft: ProfileDraft) => {
      if (!user) throw new Error(tr('Nu ești logat.'));
      const created = await createProfile(user.uid, draft, await makeThumbnail(draft.photoUrl));
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

  // Miniatura pentru chat, generată după login la profilurile care au poză, dar n-au încă miniatură.
  async function backfillThumbnail(uid: string, photoUrl: string, username: string | null) {
    try {
      const photoThumb = await makeThumbnail(photoUrl);
      if (!photoThumb) return;
      await updateProfileFields(uid, { photoThumb });
      setProfile((p) => (p && p.uid === uid ? { ...p, photoThumb } : p));
      await refreshMyPhotoInGroups(uid, photoThumb);
      if (username) await updatePublicCard(username, { photoThumb });
    } catch (e) {
      console.warn('Nu am putut salva miniatura pozei:', e);
    }
  }

  // „Editează profilul”: actualizăm imediat pe ecran; dacă salvarea în Firestore eșuează, revenim.
  // O poză nouă vine cu miniatura ei, copiată apoi și în grupurile în care ești.
  const updateProfile = useCallback(
    async (changes: ProfileChanges) => {
      if (!profile) return;
      const previous = profile;
      const photoChanged = isNewPhoto(changes, profile.photoUrl);
      const full: ProfileChanges = photoChanged
        ? { ...changes, photoThumb: changes.photoUrl ? await makeThumbnail(changes.photoUrl) : null }
        : changes;
      setProfile({ ...profile, ...full });
      if (isFirebaseConfigured) {
        try {
          await updateProfileFields(profile.uid, full);
        } catch (e) {
          setProfile(previous);
          throw e;
        }
      }
      if (photoChanged) void refreshMyPhotoInGroups(isFirebaseConfigured ? profile.uid : MOCK_UID, full.photoThumb ?? null);
      // Fișa publică (din codul QR) ține numele și miniatura la zi; o eroare aici nu anulează salvarea.
      const nameChanged = changes.name !== undefined && changes.name !== profile.name;
      if (profile.username && (photoChanged || nameChanged)) {
        updatePublicCard(profile.username, {
          ...(nameChanged ? { name: changes.name } : {}),
          ...(photoChanged ? { photoThumb: full.photoThumb ?? null } : {}),
        }).catch((e: unknown) => console.warn('Nu am putut actualiza fișa publică:', e));
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
      if (!isFirebaseConfigured || !user) throw new Error(tr('Ștergerea contului merge doar cu un cont real.'));
      // Întâi parola: dacă e greșită, nu se șterge nimic.
      await confirmPassword(password);
      await leaveAllGroups(user.uid);
      // Prieteniile, cererile și blocările tale (ce e deja șters nu contează, deci se poate relua).
      await deleteMyFriendData(user.uid);
      // Username-ul se eliberează înainte de profil (regulile verifică proprietarul din fișa publică).
      if (profile?.username) await releaseUsername(profile.username, user.uid);
      await deletePublicProfile(user.uid);
      publishedKey.current = null;
      await deleteProfile(user.uid);
      // Ultimul pas: contul din Firebase Auth. După el, sesiunea se închide și apare ecranul de login.
      await deleteCurrentUser();
    },
    [user, profile],
  );

  // „Completează-ți profilul” (conturi vechi): întâi poza (cu miniatura), apoi username-ul (tranzacție;
  // dacă e luat între timp, aruncă UsernameTakenError și ecranul cere altul).
  const completeProfile = useCallback(
    async (parts: { username?: string; photoUrl?: string }) => {
      if (!profile) return;
      let next: UserProfile = profile;
      if (parts.photoUrl) {
        const photoThumb = await makeThumbnail(parts.photoUrl);
        if (isFirebaseConfigured) await updateProfileFields(profile.uid, { photoUrl: parts.photoUrl, photoThumb });
        next = { ...next, photoUrl: parts.photoUrl, photoThumb };
        setProfile(next);
        void refreshMyPhotoInGroups(isFirebaseConfigured ? profile.uid : MOCK_UID, photoThumb);
      }
      if (parts.username) {
        await claimUsername(profile.uid, { username: parts.username, name: next.name, photoThumb: next.photoThumb ?? null });
        next = { ...next, username: parts.username };
        setProfile(next);
      }
      if (isProfileComplete(next)) setStatus('ready');
    },
    [profile],
  );

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  const value = useMemo(
    () => ({
      status,
      user,
      profile,
      error,
      completeOnboarding,
      updateBio,
      updateProfile,
      removeLearnedTag,
      signOut,
      deleteAccount,
      completeProfile,
      retry,
    }),
    [status, user, profile, error, completeOnboarding, updateBio, updateProfile, removeLearnedTag, signOut, deleteAccount, completeProfile, retry],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error(tr('useAuth() trebuie folosit în interiorul <AuthProvider>.'));
  return value;
}
