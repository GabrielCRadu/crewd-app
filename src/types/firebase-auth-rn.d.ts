/*
 * La rulare, Metro încarcă varianta React Native a `@firebase/auth` (condiția „react-native”),
 * care exportă getReactNativePersistence. Tipurile publicate ale pachetului pun însă condiția
 * „types” (web) înaintea celei „react-native”, așa că TypeScript nu vede funcția. O declarăm aici.
 */
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
