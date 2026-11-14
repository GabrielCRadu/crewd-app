import type { ChatRow, GroupMessage } from '../types/chat';
import { addDays, formatDay, formatTime, startOfDay } from './dates';

/** Lungimea maximă a unui mesaj (aceeași limită e și în `firestore.rules`). */
export const MAX_MESSAGE_LENGTH = 1000;

/** Textul gata de trimis, sau null dacă e gol ori prea lung. */
export function normalizeMessageText(text: string): string | null {
  const trimmed = text.trim();
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

/** Previzualizarea din lista de chat-uri: „Tu: …” sau „Ana: …”. */
export function lastMessagePreview(message: GroupMessage, myUid: string): string {
  const who = message.authorUid === myUid ? 'Tu' : message.authorName;
  return `${who}: ${message.text}`;
}
