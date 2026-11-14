import { Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Linking from 'expo-linking';

import { invitePath, usernameFromLink } from '../utils/inviteLink';

/*
 * Invitațiile de pe profil: codul QR și linkul trimis pe alte aplicații conțin username-ul tău unic
 * (spec 2026-11-14-username-parola-design.md). Cine le deschide ajunge la fișa ta publică
 * (poza mică, numele, @username); persoanele de test deschid profilul lor complet.
 */

/** Linkul tău de invitație (crewd://invite/<username>, sau exp://…/--/invite/<username> în Expo Go). */
export function inviteUrl(username: string): string {
  return Linking.createURL(invitePath(username));
}

/** Mesajul precompletat trimis împreună cu linkul. */
export function inviteMessage(username: string): string {
  return `Hai să fim prieteni pe Crewd! @${username} ${inviteUrl(username)}`;
}

/** Copiază linkul de invitație în clipboard. */
export async function copyInvite(username: string): Promise<void> {
  await Clipboard.setStringAsync(inviteUrl(username));
}

/**
 * Deschide meniul de share al telefonului (WhatsApp, Instagram, Messenger, SMS…).
 * Dacă share-ul nu e disponibil, copiază linkul. Întoarce 'copied' în cazul ăsta.
 */
export async function shareInvite(username: string): Promise<'shared' | 'copied'> {
  try {
    await Share.share({ message: inviteMessage(username), url: inviteUrl(username) });
    return 'shared';
  } catch {
    await copyInvite(username);
    return 'copied';
  }
}

/** Username-ul dintr-un link deschis, sau null dacă nu e o invitație validă. */
export function usernameFromUrl(url: string): string | null {
  return usernameFromLink(Linking.parse(url));
}
