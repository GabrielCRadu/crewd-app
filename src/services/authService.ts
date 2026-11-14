import {
  EmailAuthProvider,
  createUserWithEmailAndPassword,
  deleteUser,
  reauthenticateWithCredential,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { auth } from '../lib/firebase';
import { MIN_PASSWORD_LENGTH } from '../utils/passwordRules';
import { tr } from '../i18n';

/*
 * Autentificarea cu email și parolă (Firebase Auth). Ecranele folosesc doar funcțiile de aici
 * și hook-ul useAuth(); mesajele de eroare sunt deja traduse pentru utilizator.
 */

export type AuthUser = Pick<User, 'uid' | 'email'>;


function requireAuth() {
  if (!auth) throw new Error('Firebase nu e configurat (lipsește .env.local).');
  return auth;
}

export async function signIn(email: string, password: string): Promise<void> {
  try {
    await signInWithEmailAndPassword(requireAuth(), email.trim(), password);
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

export async function signUp(email: string, password: string): Promise<void> {
  try {
    await createUserWithEmailAndPassword(requireAuth(), email.trim(), password);
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

export async function resetPassword(email: string): Promise<void> {
  try {
    await sendPasswordResetEmail(requireAuth(), email.trim());
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(requireAuth());
}

/**
 * Confirmă parola utilizatorului logat (Firebase o cere înainte de ștergerea contului).
 * Aruncă eroare cu mesaj pentru utilizator dacă parola e greșită.
 */
export async function confirmPassword(password: string): Promise<void> {
  const user = requireAuth().currentUser;
  if (!user?.email) throw new Error(tr('Nu ești logat.'));
  try {
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

/** Șterge contul din Firebase Auth (după confirmPassword și după ce datele au fost șterse). */
export async function deleteCurrentUser(): Promise<void> {
  const user = requireAuth().currentUser;
  if (!user) throw new Error(tr('Nu ești logat.'));
  try {
    await deleteUser(user);
  } catch (e) {
    throw new Error(toMessage(e));
  }
}

/** Ascultă schimbările de sesiune. Returnează funcția de dezabonare. */
export function subscribeToAuth(listener: (user: AuthUser | null) => void): () => void {
  if (!auth) {
    listener(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => listener(user ? { uid: user.uid, email: user.email } : null));
}

/** Validare simplă de email, înainte să trimitem la Firebase. */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Codurile de eroare Firebase Auth → mesaje pe înțelesul utilizatorului. */
function toMessage(e: unknown): string {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  switch (code) {
    case 'auth/invalid-email':
      return tr('Adresa de email nu e validă.');
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return tr('Email sau parolă greșită.');
    case 'auth/email-already-in-use':
      return tr('Există deja un cont cu acest email. Încearcă să te loghezi.');
    case 'auth/weak-password':
      return tr('Parola e prea slabă: minim {min} caractere, o literă mică și o literă mare.', { min: MIN_PASSWORD_LENGTH });
    case 'auth/too-many-requests':
      return tr('Prea multe încercări. Așteaptă puțin și încearcă din nou.');
    case 'auth/network-request-failed':
      return tr('Nu există conexiune la internet.');
    case 'auth/requires-recent-login':
      return tr('Din motive de siguranță, confirmă din nou parola.');
    case 'auth/missing-password':
      return tr('Introdu parola.');
    case 'auth/operation-not-allowed':
      return tr('Autentificarea cu email nu e activată în Firebase.');
    default:
      return tr('Ceva n-a mers. Încearcă din nou.');
  }
}
