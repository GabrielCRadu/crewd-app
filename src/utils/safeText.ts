/*
 * Text și linkuri venite din afară (evenimente importate, nume, oraș): curățate înainte de afișare
 * sau salvare (audit 2026-11-14, „Securitate în aplicație”).
 */

/** Un link de deschis din aplicație: doar `https:`; orice altceva (tel:, sms:, market:, javascript:…) → null. */
export function safeExternalUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

/**
 * Caractere invizibile sau de inversare a direcției textului (folosite ca să falsifici vizual un nume):
 * zero-width, marcaje și suprascrieri bidi, BOM.
 */
const INVISIBLE = /[\u200B-\u200F\u202A-\u202E\u2060-\u2069\uFEFF]/g;

/** Fără caractere invizibile (păstrează rândurile noi; pentru mesaje). */
export function stripInvisible(text: string): string {
  return text.replace(INVISIBLE, '');
}

/** Fără caractere invizibile, spații strânse, tăiat la `max` caractere. */
export function sanitizeText(text: string, max: number): string {
  return text.replace(INVISIBLE, '').replace(/\s+/g, ' ').trim().slice(0, max);
}
