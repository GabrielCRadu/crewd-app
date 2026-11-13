import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User } from 'firebase/auth';

import { auth } from '../lib/firebase';

/*
 * Autentificarea cu email și parolă (Firebase Auth). Ecranele folosesc doar funcțiile de aici
 * și hook-ul useAuth(); mesajele de eroare sunt deja traduse pentru utilizator.
 */

export type AuthUser = Pick<User, 'uid' | 'email'>;

/** Parola minimă acceptată de Firebase e de 6 caractere; cerem puțin mai mult. */
export const MIN_PASSWORD_LENGTH = 8;

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
      return 'Adresa de email nu e validă.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email sau parolă greșită.';
    case 'auth/email-already-in-use':
      return 'Există deja un cont cu acest email. Încearcă să te loghezi.';
    case 'auth/weak-password':
      return `Parola e prea slabă. Folosește cel puțin ${MIN_PASSWORD_LENGTH} caractere.`;
    case 'auth/too-many-requests':
      return 'Prea multe încercări. Așteaptă puțin și încearcă din nou.';
    case 'auth/network-request-failed':
      return 'Nu există conexiune la internet.';
    case 'auth/operation-not-allowed':
      return 'Autentificarea cu email nu e activată în Firebase.';
    default:
      return 'Ceva n-a mers. Încearcă din nou.';
  }
}
