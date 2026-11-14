/*
 * Linkul de invitație din codul QR de pe profil: `<aplicația>/invite/<uid>`.
 * Folosește uid-ul, deci e stabil: nu se schimbă la fiecare deschidere.
 * - în aplicația instalată: crewd://invite/<uid>
 * - în Expo Go:             exp://<ip>:8081/--/invite/<uid>
 * Un link https://<domeniu>/invite/<uid> cere un domeniu propriu (universal links); nu avem încă.
 * Funcții pure (fără expo-linking), ca să le putem testa.
 */

/** Segmentul din link care arată că urmează id-ul persoanei care invită. */
const INVITE_SEGMENT = 'invite';

/** Calea din link pentru invitația cuiva (fără schemă), ex. `invite/p4`. */
export function invitePath(personId: string): string {
  return `${INVITE_SEGMENT}/${encodeURIComponent(personId)}`;
}

/** Ce scoatem dintr-un link deschis (forma lui `Linking.parse`). */
export interface ParsedLink {
  hostname: string | null;
  path: string | null;
}

/**
 * Id-ul persoanei dintr-un link de invitație, sau null dacă linkul nu e unul de invitație.
 * La crewd://invite/p4 „invite” ajunge ca hostname; în Expo Go e la începutul căii (după `--/`).
 */
export function personIdFromLink({ hostname, path }: ParsedLink): string | null {
  const segments = [hostname ?? '', ...(path ?? '').split('/')].filter((s) => s !== '' && s !== '--');
  const at = segments.indexOf(INVITE_SEGMENT);
  const id = at >= 0 ? segments[at + 1] : undefined;
  if (!id) return null;
  try {
    return decodeURIComponent(id);
  } catch {
    return null;
  }
}
