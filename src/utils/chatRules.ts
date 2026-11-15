import type { ChatRow, GroupMessage } from '../types/chat';
import { addDays, formatDay, formatTime, startOfDay } from './dates';
import { canOpenChat } from './groupRules';
import { tr } from '../i18n';
import { stripInvisible } from './safeText';

/** Ce vede cine a ieșit (sau a fost scos) din grup cu conversația deschisă. */
export const LEFT_GROUP_MESSAGE = 'Nu mai ești în acest grup.';

/** Lungimea maximă a unui mesaj (aceeași limită e și în `firestore.rules`). */
export const MAX_MESSAGE_LENGTH = 1000;

/** Textul gata de trimis, sau null dacă e gol ori prea lung. */
export function normalizeMessageText(text: string): string | null {
  const trimmed = stripInvisible(text).trim();
  if (trimmed.length === 0 || trimmed.length > MAX_MESSAGE_LENGTH) return null;
  return trimmed;
}

/** Eticheta separatorului de zi: „Azi”, „Ieri” sau „Mar, 10 nov”. */
export function dayLabel(d: Date, now = new Date()): string {
  const day = startOfDay(d).getTime();
  const today = startOfDay(now);
  if (day === today.getTime()) return 'Azi';
  if (day === addDays(today, -1).getTime()) return 'Ieri';
  return formatDay(d, now);
}

function dayKey(d: Date): string {
  const mm = `${d.getMonth() + 1}`.padStart(2, '0');
  const dd = `${d.getDate()}`.padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Rândurile conversației, din mesajele în ordine cronologică: separatoare de zi și mesaje.
 * Într-un șir de mesaje ale aceleiași persoane (în aceeași zi), numele apare la primul, miniatura la ultimul.
 */
export function buildChatRows(
  messages: GroupMessage[],
  myUid: string,
  members: Record<string, { photo?: string | null }>,
  now = new Date(),
): ChatRow[] {
  const rows: ChatRow[] = [];
  messages.forEach((message, i) => {
    const prev = messages[i - 1];
    const next = messages[i + 1];
    const day = dayKey(message.createdAt);
    const newDay = !prev || dayKey(prev.createdAt) !== day;
    if (newDay) rows.push({ kind: 'day', key: `day-${day}`, label: dayLabel(message.createdAt, now) });

    const isMine = message.authorUid === myUid;
    const startsRun = newDay || prev!.authorUid !== message.authorUid;
    const endsRun = !next || next.authorUid !== message.authorUid || dayKey(next.createdAt) !== day;
    rows.push({
      kind: 'message',
      key: message.id,
      message,
      isMine,
      showName: !isMine && startsRun,
      showAvatar: !isMine && endsRun,
      photo: members[message.authorUid]?.photo ?? null,
      time: formatTime(message.createdAt),
    });
  });
  return rows;
}

/**
 * Numele cu care semnezi un mesaj: cel din intrarea ta din grup (`members[uid].name`), pe care îl verifică
 * și firestore.rules, ca nimeni să nu poată scrie în numele altcuiva. Fără intrare: numele din profil.
 */
export function authorNameFor(members: Record<string, { name: string }>, uid: string, profileName: string): string {
  return members[uid]?.name ?? profileName;
}

/** Previzualizarea din lista de chat-uri: „Tu: …” sau „Ana: …”. */
export function lastMessagePreview(message: GroupMessage, myUid: string): string {
  const who = message.authorUid === myUid ? 'Tu' : message.authorName;
  return `${who}: ${message.removed ? removedMessageText(message.removed.category, false) : message.text}`;
}

/** Numele categoriilor de moderare (functions/src/moderation/rules.ts), pentru autorul mesajului eliminat. */
function categoryLabel(category: string): string | null {
  switch (category) {
    case 'threat':
      return tr('amenințare');
    case 'harassment':
      return tr('hărțuire');
    case 'hate':
      return tr('discurs de ură');
    case 'sexual':
      return tr('conținut sexual');
    case 'scam':
      return tr('înșelătorie');
    case 'illegal':
      return tr('activități ilegale');
    case 'personal_data':
      return tr('date personale');
    case 'spam':
      return tr('spam');
    default:
      return null;
  }
}

/**
 * Ce apare în locul unui mesaj eliminat de moderare: ceilalți văd doar că a fost eliminat;
 * autorul vede și motivul.
 */
export function removedMessageText(category: string, isMine: boolean): string {
  if (!isMine) return tr('Mesaj eliminat de moderare');
  const label = categoryLabel(category);
  return label ? tr('Mesajul tău a fost eliminat ({reason})', { reason: label }) : tr('Mesajul tău a fost eliminat');
}

export type ChatRoomState = 'loading' | 'left' | 'forming' | 'ready';

/**
 * Ce arată ecranul conversației: se încarcă, nu mai ești în grup, grupul încă se formează, sau conversația.
 * Contează doar ce știm acum (grupurile mele și eroarea ascultării de acum), ca după o reintrare în grup
 * ecranul să revină singur la conversație.
 */
export function chatRoomState(input: {
  groupsLoading: boolean;
  group: { memberUids: string[]; formedAt: Date | null } | null;
  uid: string | null;
  messagesError: string | null;
}): ChatRoomState {
  const { groupsLoading, group, uid, messagesError } = input;
  if (!group) return groupsLoading ? 'loading' : 'left';
  if (!uid || !group.memberUids.includes(uid)) return 'left';
  if (!canOpenChat(group)) return 'forming';
  if (messagesError === LEFT_GROUP_MESSAGE) return 'left';
  return 'ready';
}

/** Mesajele fără cele ale persoanelor pe care le-ai blocat (audit: siguranța în chatul de grup). */
export function withoutBlocked(messages: GroupMessage[], blockedUids: string[]): GroupMessage[] {
  if (blockedUids.length === 0) return messages;
  return messages.filter((m) => !blockedUids.includes(m.authorUid));
}
