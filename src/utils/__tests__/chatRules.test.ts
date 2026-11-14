import { describe, expect, it } from '@jest/globals';

import type { ChatRow, GroupMessage } from '../../types/chat';
import { buildChatRows, dayLabel, lastMessagePreview, normalizeMessageText } from '../chatRules';

// Ore locale (nu UTC), ca testele să nu depindă de fusul orar al calculatorului.
const now = new Date(2026, 10, 14, 18, 0);
const today = (h: number, m: number) => new Date(2026, 10, 14, h, m);
const yesterday = (h: number, m: number) => new Date(2026, 10, 13, h, m);

function msg(id: string, authorUid: string, authorName: string, createdAt: Date, text = 'salut'): GroupMessage {
  return { id, authorUid, authorName, text, createdAt };
}

type MessageRow = Extract<ChatRow, { kind: 'message' }>;
const messagesOnly = (rows: ChatRow[]) => rows.filter((r): r is MessageRow => r.kind === 'message');

describe('normalizeMessageText', () => {
  it('trims spaces around the text', () => {
    expect(normalizeMessageText('  salut  ')).toBe('salut');
  });

  it('rejects a message made only of whitespace', () => {
    expect(normalizeMessageText('   \n ')).toBeNull();
  });

  it('rejects a message longer than 1000 characters', () => {
    expect(normalizeMessageText('a'.repeat(1001))).toBeNull();
  });

  it('accepts exactly 1000 characters', () => {
    expect(normalizeMessageText('a'.repeat(1000))).toHaveLength(1000);
  });
});

describe('dayLabel', () => {
  it('says "Azi" for today', () => {
    expect(dayLabel(today(9, 0), now)).toBe('Azi');
  });

  it('says "Ieri" for yesterday', () => {
    expect(dayLabel(yesterday(23, 59), now)).toBe('Ieri');
  });

  it('uses the short date for older days', () => {
    expect(dayLabel(new Date(2026, 10, 10, 12, 0), now)).toBe('Mar, 10 nov');
  });
});

describe('buildChatRows', () => {
  const members = {
    ana: { photo: 'https://example.com/ana.jpg' },
    me: { photo: null },
  };

  it('starts with a day separator and adds one when the day changes', () => {
    const rows = buildChatRows(
      [msg('1', 'ana', 'Ana', yesterday(20, 0)), msg('2', 'ana', 'Ana', today(10, 0))],
      'me',
      members,
      now,
    );
    expect(rows.map((r) => r.kind)).toEqual(['day', 'message', 'day', 'message']);
    expect(rows[0]).toMatchObject({ kind: 'day', label: 'Ieri' });
    expect(rows[2]).toMatchObject({ kind: 'day', label: 'Azi' });
  });

  it('shows the name once and the avatar only on the last of consecutive messages', () => {
    const rows = messagesOnly(
      buildChatRows(
        [
          msg('1', 'ana', 'Ana', today(18, 0)),
          msg('2', 'ana', 'Ana', today(18, 1)),
          msg('3', 'ana', 'Ana', today(18, 2)),
        ],
        'me',
        members,
        now,
      ),
    );
    expect(rows.map((r) => r.showName)).toEqual([true, false, false]);
    expect(rows.map((r) => r.showAvatar)).toEqual([false, false, true]);
  });

  it('marks my messages as mine, without name or avatar', () => {
    const [row] = messagesOnly(buildChatRows([msg('1', 'me', 'Radu', today(18, 0))], 'me', members, now));
    expect(row).toMatchObject({ isMine: true, showName: false, showAvatar: false });
  });

  it('shows the name again after a day separator', () => {
    const rows = messagesOnly(
      buildChatRows([msg('1', 'ana', 'Ana', yesterday(22, 0)), msg('2', 'ana', 'Ana', today(8, 0))], 'me', members, now),
    );
    expect(rows.map((r) => r.showName)).toEqual([true, true]);
    expect(rows.map((r) => r.showAvatar)).toEqual([true, true]);
  });

  it('shows the name again when another person wrote in between', () => {
    const rows = messagesOnly(
      buildChatRows(
        [msg('1', 'ana', 'Ana', today(18, 0)), msg('2', 'me', 'Radu', today(18, 1)), msg('3', 'ana', 'Ana', today(18, 2))],
        'me',
        members,
        now,
      ),
    );
    expect(rows[0]).toMatchObject({ showName: true, showAvatar: true });
    expect(rows[2]).toMatchObject({ showName: true, showAvatar: true });
  });

  it('takes the photo from the group members', () => {
    const [row] = messagesOnly(buildChatRows([msg('1', 'ana', 'Ana', today(18, 0))], 'me', members, now));
    expect(row!.photo).toBe('https://example.com/ana.jpg');
  });

  it('keeps messages of someone who left the group, with no photo', () => {
    const [row] = messagesOnly(buildChatRows([msg('1', 'gone', 'Mihai', today(18, 0))], 'me', members, now));
    expect(row!.photo).toBeNull();
    expect(row!.message.authorName).toBe('Mihai');
    expect(row!.showName).toBe(true);
  });

  it('formats the time of each message', () => {
    const [row] = messagesOnly(buildChatRows([msg('1', 'ana', 'Ana', today(18, 2))], 'me', members, now));
    expect(row!.time).toBe('18:02');
  });

  it('uses unique keys for days and messages', () => {
    const rows = buildChatRows([msg('m1', 'ana', 'Ana', today(18, 0))], 'me', members, now);
    expect(rows.map((r) => r.key)).toEqual(['day-2026-11-14', 'm1']);
  });
});

describe('lastMessagePreview', () => {
  it('prefixes my own message with "Tu"', () => {
    expect(lastMessagePreview(msg('1', 'me', 'Radu', now, 'Ne vedem la intrare'), 'me')).toBe('Tu: Ne vedem la intrare');
  });

  it("prefixes someone else's message with their name", () => {
    expect(lastMessagePreview(msg('1', 'ana', 'Ana', now, 'Salut!'), 'me')).toBe('Ana: Salut!');
  });
});
