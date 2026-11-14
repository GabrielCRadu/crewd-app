import { Pressable, StyleSheet, Text, View } from 'react-native';

import Avatar from '../Avatar';
import { colors } from '../../theme/colors';
import { glass } from '../../theme/shape';
import { tr } from '../../i18n';
import type { ChatRow } from '../../types/chat';

const AVATAR_SIZE = 28;

/** Separatorul de zi din conversație („Azi”, „Ieri”, „Mar, 10 nov”). */
export function DayRow({ label }: { label: string }) {
  return <Text style={styles.day}>{label}</Text>;
}

/**
 * Un mesaj din conversația de grup. Ale altora: în stânga, cu numele deasupra (primul dintr-un șir)
 * și miniatura autorului (ultimul dintr-un șir). Ale mele: în dreapta, pe alb, fără nume.
 * Miniatura și numele deschid profilul autorului (`onOpenAuthor`).
 */
export default function MessageRow({
  row,
  onOpenAuthor,
}: {
  row: Extract<ChatRow, { kind: 'message' }>;
  onOpenAuthor?: (uid: string) => void;
}) {
  const { message, isMine, showName, showAvatar, photo, time } = row;

  if (isMine) {
    return (
      <View style={[styles.bubble, styles.bubbleMine, styles.mine]}>
        <Text style={[styles.text, styles.textMine]}>
          {message.text}
          <Text style={styles.timeMine}>{`  ${time}`}</Text>
        </Text>
      </View>
    );
  }

  const openAuthor = () => onOpenAuthor?.(message.authorUid);

  return (
    <View style={styles.other}>
      {showName ? (
        <Pressable onPress={openAuthor} disabled={!onOpenAuthor} hitSlop={6} style={styles.authorPress}>
          <Text style={styles.author}>{message.authorName}</Text>
        </Pressable>
      ) : null}
      <View style={styles.row}>
        {showAvatar ? (
          <Pressable
            onPress={openAuthor}
            disabled={!onOpenAuthor}
            hitSlop={6}
            accessibilityRole="button"
            accessibilityLabel={tr('Profilul lui {name}', { name: message.authorName })}
          >
            <Avatar name={message.authorName || '?'} size={AVATAR_SIZE} photoUrl={photo} />
          </Pressable>
        ) : (
          <View style={styles.avatarSpace} />
        )}
        <View style={[styles.bubble, styles.bubbleOther]}>
          <Text style={styles.text}>
            {message.text}
            <Text style={styles.time}>{`  ${time}`}</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  day: { alignSelf: 'center', color: colors.faint, fontSize: 12, marginVertical: 4 },
  other: { alignSelf: 'flex-start', maxWidth: '85%', gap: 3 },
  // Numele stă deasupra bulei, aliniat cu ea (după locul avatarului).
  authorPress: { alignSelf: 'flex-start', marginLeft: AVATAR_SIZE + 8 },
  author: { color: colors.muted, fontSize: 12, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  avatarSpace: { width: AVATAR_SIZE },
  mine: { alignSelf: 'flex-end', maxWidth: '85%' },
  bubble: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, flexShrink: 1 },
  bubbleOther: { ...glass, borderBottomLeftRadius: 6 },
  bubbleMine: { backgroundColor: colors.text, borderBottomRightRadius: 6 },
  text: { color: colors.text, fontSize: 15 },
  textMine: { color: colors.onLight },
  time: { color: colors.faint, fontSize: 11 },
  timeMine: { color: colors.onLightMuted, fontSize: 11 },
});
