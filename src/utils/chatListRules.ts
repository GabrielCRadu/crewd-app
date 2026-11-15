import type { GroupMessage } from '../types/chat';
import type { CrewGroup } from '../types/groups';
import { dayLabel } from './chatRules';
import { formatTime, startOfDay } from './dates';

/*
 * Logica listei din tab-ul Chat (fără React, ca să se poată testa): ce e necitit, ordinea grupurilor,
 * ora din dreapta rândului și inițialele / tonul imaginii unui grup fără poză.
 */

/** Cheia „citit” a unei conversații de grup (src/services/chatReadState.ts). */
export const groupReadKey = (eventId: string, groupId: string) => `group:${eventId}/${groupId}`;

/** Cheia „citit” a unei conversații directe. */
export const dmReadKey = (personId: string) => `dm:${personId}`;

/**
 * Necitit = ultimul mesaj e mai nou decât momentul în care ai citit conversația și nu e al tău.
 * Fără moment salvat (conversație nedeschisă pe acest telefon) contează orice mesaj al altcuiva.
 */
export function isUnread(last: { at: Date; mine: boolean } | null, lastReadMs: number | undefined): boolean {
  if (!last || last.mine) return false;
  return last.at.getTime() > (lastReadMs ?? 0);
}

/**
 * Grupurile, cele cu mesajul cel mai recent primele; cele fără mesaje după ele, după ora întâlnirii.
 * `lastById`: ultimul mesaj al fiecărui grup (după id), sau null / lipsă dacă n-are.
 */
export function sortGroupsByActivity(
  groups: CrewGroup[],
  lastById: Record<string, GroupMessage | null | undefined>,
): CrewGroup[] {
  return [...groups].sort((a, b) => {
    const la = lastById[a.id]?.createdAt.getTime();
    const lb = lastById[b.id]?.createdAt.getTime();
    if (la !== undefined && lb !== undefined) return lb - la;
    if (la !== undefined) return -1;
    if (lb !== undefined) return 1;
    return a.meetupAt.getTime() - b.meetupAt.getTime();
  });
}

/** Ora din dreapta rândului: azi ora („18:02”), altfel ziua („Ieri”, „Mar, 10 nov”). */
export function shortWhen(d: Date, now = new Date()): string {
  // Azi: ora; altfel eticheta zilei (tradusă, deci nu comparăm cu textul „Azi”).
  return startOfDay(d).getTime() === startOfDay(now).getTime() ? formatTime(d) : dayLabel(d, now);
}

/** Două inițiale din titlu („Open Mic Night” → „OM”; un singur cuvânt → primele două litere). */
export function groupInitials(title: string): string {
  const words = title.trim().split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  if (words.length === 0) return '?';
  const letter = (w: string) => w.match(/[\p{L}\p{N}]/u)?.[0] ?? '';
  if (words.length === 1) return [...words[0]!.replace(/[^\p{L}\p{N}]/gu, '')].slice(0, 2).join('').toUpperCase();
  return (letter(words[0]!) + letter(words[1]!)).toUpperCase();
}

/** Indicele tonului din paletă, același mereu pentru același titlu (hash simplu pe caractere). */
export function toneIndex(title: string, count: number): number {
  if (count <= 0) return 0;
  let hash = 0;
  for (const ch of title) hash = (hash * 31 + (ch.codePointAt(0) ?? 0)) | 0;
  return Math.abs(hash) % count;
}
