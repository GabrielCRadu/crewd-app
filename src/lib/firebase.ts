import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
// getReactNativePersistence există doar în varianta React Native a SDK-ului (pe care o alege Metro);
// tipul lui e declarat în src/types/firebase-auth-rn.d.ts.
import { getReactNativePersistence, initializeAuth } from 'firebase/auth';
import type { Auth } from 'firebase/auth';
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

/** false când lipsește config-ul: aplicația folosește atunci datele mock și sare peste login. */
export const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

const app: FirebaseApp | null = isFirebaseConfigured
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

/** Baza de date Firestore, sau null dacă Firebase nu e configurat. */
export const db: Firestore | null = app
  ? // În React Native, conexiunea standard a Firestore poate fi blocată; long polling-ul detectat automat o ocolește.
    initializeFirestore(app, { experimentalAutoDetectLongPolling: true })
  : null;

/**
 * Autentificarea Firebase, cu sesiunea păstrată în AsyncStorage (rămâi logat după repornire),
 * cum recomandă expo.fyi/firebase-js-auth-setup. null dacă Firebase nu e configurat.
 */
export const auth: Auth | null = app
  ? initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) })
  : null;
