import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

import { invitePath, personIdFromLink } from '../utils/inviteLink';
import { tr } from '../i18n';

/*
 * Invitațiile de pe profil: codul QR și linkul trimis pe alte aplicații duc la profilul tău,
 * de unde cineva te poate adăuga la prieteni.
 * Cu Firebase: cine deschide linkul are nevoie de profilul tău public (users/{uid} e privat),
 * deci deocamdată linkul se deschide doar pentru persoanele de test (PEOPLE).
 */

/** Linkul tău de invitație (crewd://invite/<uid>, sau exp://…/--/invite/<uid> în Expo Go). */
export function inviteUrl(uid: string): string {
  return Linking.createURL(invitePath(uid));
}

/** Mesajul precompletat trimis împreună cu linkul. */
export function inviteMessage(uid: string): string {
  return tr('Hai să fim prieteni pe Crewd! {url}', { url: inviteUrl(uid) });
}

/** Copiază linkul de invitație în clipboard. */
export async function copyInvite(uid: string): Promise<void> {
  await Clipboard.setStringAsync(inviteUrl(uid));
}

/**
 * Deschide meniul de share al telefonului (WhatsApp, Instagram, Messenger, SMS…).
 * Dacă share-ul nu e disponibil, copiază linkul. Întoarce 'copied' în cazul ăsta.
 */
export async function shareInvite(uid: string): Promise<'shared' | 'copied'> {
  try {
    await Share.share({ message: inviteMessage(uid), url: inviteUrl(uid) });
    return 'shared';
  } catch {
    await copyInvite(uid);
    return 'copied';
  }
}

/** Id-ul persoanei dintr-un link deschis, sau null dacă nu e o invitație. */
export function personIdFromUrl(url: string): string | null {
  return personIdFromLink(Linking.parse(url));
}
