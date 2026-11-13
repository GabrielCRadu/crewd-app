import { getApp, getApps, initializeApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

/*
 * Conexiunea la Firebase (SDK-ul JS, merge în Expo Go: docs.expo.dev/guides/using-firebase).
 * Config-ul vine din .env.local (vezi .env.example), nu din cod. Expo înlocuiește
 * `process.env.EXPO_PUBLIC_*` la compilare, deci numele trebuie scrise exact așa.
 */
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

/** false când lipsește config-ul: aplicația folosește atunci datele mock. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

function createDb(): Firestore | null {
  if (!isFirebaseConfigured) return null;
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  // În React Native, conexiunea standard a Firestore poate fi blocată; long polling-ul detectat automat o ocolește.
  return initializeFirestore(app, { experimentalAutoDetectLongPolling: true });
}

/** Baza de date Firestore, sau null dacă Firebase nu e configurat. */
export const db = createDb();
