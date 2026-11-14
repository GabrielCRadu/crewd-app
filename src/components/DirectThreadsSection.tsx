import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from './Avatar';
import { useDirectThreads } from '../hooks/useDirectThreads';
import { sortedThreads } from '../services/directMessagesService';
import type { DirectMessage } from '../services/directMessagesService';
import { getPerson } from '../services/peopleService';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import { formatTime } from '../utils/dates';
import { tr } from '../i18n';

interface Props {
  onOpen: (personId: string) => void;
}

/** Ultimul mesaj, pe scurt: textul sau „Ai trimis un eveniment”. */
function preview(message: DirectMessage): string {
  const who = message.fromMe ? 'Tu: ' : '';
  if (message.text) return who + message.text;
  return message.fromMe ? tr('Ai trimis un eveniment') : tr('Ți-a trimis un eveniment');
}

/** Secțiunea „Mesaje directe” din tab-ul Chat: conversațiile doar cu un prieten. Nu apare dacă nu ai niciuna. */
export default function DirectThreadsSection({ onOpen }: Props) {
  const threads = sortedThreads(useDirectThreads());
  if (threads.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{tr('Mesaje directe')}</Text>
      {threads.map(({ personId, last }) => {
        const person = getPerson(personId);
        if (!person) return null;
        return (
          <Pressable key={personId} onPress={() => onOpen(personId)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
            <Avatar name={person.name} size={48} photoUrl={person.photoUrl} />
            <View style={styles.text}>
              <Text style={styles.name}>{person.name}</Text>
              <Text style={styles.preview} numberOfLines={1}>
                {preview(last)}
              </Text>
            </View>
            <Text style={styles.time}>{formatTime(last.sentAt)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 12 },
  sectionTitle: { ...type.label, marginTop: 12 },
  row: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: radii.card },
  pressed: { opacity: 0.8 },
  text: { flex: 1, gap: 3 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  preview: { fontSize: 13, color: colors.muted },
  time: { fontSize: 12, color: colors.faint, alignSelf: 'flex-start' },
});
