import { usernameError } from './usernameRules';

/*
 * Linkul de invitație din codul QR de pe profil: `<aplicația>/invite/<username>`
 * (spec 2026-11-14-username-parola-design.md: în QR e username-ul unic, nu id-ul intern).
 * - în aplicația instalată: crewd://invite/<username>
 * - în Expo Go:             exp://<ip>:8081/--/invite/<username>
 * Un link https://<domeniu>/invite/<username> cere un domeniu propriu (universal links); nu avem încă.
 * Funcții pure (fără expo-linking), ca să le putem testa.
 */

/** Segmentul din link care arată că urmează username-ul persoanei care invită. */
const INVITE_SEGMENT = 'invite';

/** Calea din link pentru invitația cuiva (fără schemă), ex. `invite/radu.g`. */
export function invitePath(username: string): string {
  return `${INVITE_SEGMENT}/${username}`;
}

/** Ce scoatem dintr-un link deschis (forma lui `Linking.parse`). */
export interface ParsedLink {
  hostname: string | null;
  path: string | null;
}

/**
 * Username-ul dintr-un link de invitație, sau null dacă linkul nu e o invitație validă.
 * La crewd://invite/radu.g „invite” ajunge ca hostname; în Expo Go e la începutul căii (după `--/`).
 */
export function usernameFromLink({ hostname, path }: ParsedLink): string | null {
  const segments = [hostname ?? '', ...(path ?? '').split('/')].filter((s) => s !== '' && s !== '--');
  const at = segments.indexOf(INVITE_SEGMENT);
  const username = at >= 0 ? segments[at + 1] : undefined;
  if (!username || usernameError(username)) return null;
  return username;
}
