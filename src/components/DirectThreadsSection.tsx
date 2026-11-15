import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from './Avatar';
import { useDirectThreads } from '../hooks/useDirectThreads';
import { sortedThreads } from '../services/directMessagesService';
import type { DirectMessage } from '../services/directMessagesService';
import { getPerson } from '../services/peopleService';
import { isDmReadyToShow, removedMessageText } from '../utils/chatRules';
import { useModerationTick } from '../hooks/useModerationTick';
import { usePublicProfiles } from '../hooks/usePublicProfiles';
import { colors, onThemeChange } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { shortWhen } from '../utils/chatListRules';
import { tr } from '../i18n';

interface Props {
  onOpen: (personId: string) => void;
  /** Conversațiile necitite (useChatActivity), cu bulină. */
  unreadIds: string[];
}

/** Ultimul mesaj, pe scurt: textul sau „Ai trimis un eveniment”. */
function preview(message: DirectMessage, now: number): string {
  const who = message.fromMe ? 'Tu: ' : '';
  // Un mesaj nou al prietenului apare abia după moderare (sau după 60 s): până atunci, „…”.
  if (!isDmReadyToShow(message, now)) return '…';
  // Lista vine din dms/{a_b}: un ultim mesaj eliminat are textul și evenimentul golite.
  if (message.removed || (!message.text && !message.eventId)) return who + removedMessageText(message.removed?.category ?? '', false);
  if (message.text) return who + message.text;
  return message.fromMe ? tr('Ai trimis un eveniment') : tr('Ți-a trimis un eveniment');
}

/** Tab-ul „Mesaje directe” din Chat: conversațiile doar cu un prieten, cea mai recentă prima. */
export default function DirectThreadsSection({ onOpen, unreadIds }: Props) {
  const threads = sortedThreads(useDirectThreads());
  const real = usePublicProfiles(threads.map((t) => t.personId).filter((id) => !getPerson(id)));
  // Cât un mesaj nou așteaptă moderarea, lista se reîmprospătează (apare după verificare sau după 60 s).
  useModerationTick(threads.some((t) => !isDmReadyToShow(t.last, Date.now())));
  if (threads.length === 0) return <Text style={styles.empty}>{tr('Nicio conversație încă. Scrie-i unui prieten! 💬')}</Text>;

  return (
    <View style={styles.section}>
      {threads.map(({ personId, last }) => {
        const pub = real[personId];
        const person = getPerson(personId) ?? (pub ? { name: pub.name, photoUrl: pub.photoUrl ?? undefined } : null);
        if (!person) return null;
        const unread = unreadIds.includes(personId);
        return (
          <Pressable key={personId} onPress={() => onOpen(personId)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Avatar name={person.name} size={48} photoUrl={person.photoUrl} />
            <View style={styles.text}>
              <Text style={styles.name} numberOfLines={1}>
                {person.name}
              </Text>
              <Text style={[styles.preview, unread && styles.previewUnread]} numberOfLines={1}>
                {preview(last, Date.now())}
              </Text>
            </View>
            <View style={styles.side}>
              <Text style={styles.time}>{shortWhen(last.sentAt)}</Text>
              {unread ? <View style={styles.dot} accessibilityLabel={tr('Necitit')} /> : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    section: { gap: 12 },
    empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 24 },
    row: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.card },
    pressed: { opacity: 0.8 },
    text: { flex: 1, gap: 3 },
    name: { fontSize: 16, fontWeight: '600', color: colors.text },
    preview: { fontSize: 13, color: colors.muted },
    previewUnread: { color: colors.text, fontWeight: '600' },
    side: { alignSelf: 'stretch', alignItems: 'flex-end', justifyContent: 'space-between', paddingVertical: 2 },
    time: { fontSize: 12, color: colors.faint },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.text },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
