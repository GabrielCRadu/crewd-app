import { StyleSheet, Text, View } from 'react-native';

import { useLastMessage } from '../../hooks/useLastMessage';
import { colors, onThemeChange } from '../../theme/colors';
import { dayLabel, lastMessagePreview } from '../../utils/chatRules';
import { formatTime } from '../../utils/dates';

interface Props {
  eventId: string;
  groupId: string;
  myUid: string;
  /** Ce se arată cât timp grupul n-are mesaje (ex. numele membrilor). */
  fallback: string;
}

/**
 * Rândul de sub numele grupului din lista de chat-uri: ultimul mesaj („Ana: …” / „Tu: …”) și ora lui.
 * E o componentă separată ca fiecare card să aibă propriul hook (hook-urile nu se apelează într-un `map`).
 */
export default function LastMessageLine({ eventId, groupId, myUid, fallback }: Props) {
  const message = useLastMessage(eventId, groupId);

  if (!message) {
    return (
      <Text style={styles.text} numberOfLines={1}>
        {fallback}
      </Text>
    );
  }

  // Azi: ora; altfel ziua („Ieri”, „Mar, 10 nov”).
  const when = dayLabel(message.createdAt) === 'Azi' ? formatTime(message.createdAt) : dayLabel(message.createdAt);
  return (
    <View style={styles.row}>
      <Text style={[styles.text, styles.preview]} numberOfLines={1}>
        {lastMessagePreview(message, myUid)}
      </Text>
      <Text style={styles.time}>{when}</Text>
    </View>
  );
}

const makeStyles = () =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    text: { fontSize: 13, color: colors.muted },
    preview: { flex: 1 },
    time: { fontSize: 12, color: colors.faint },
  });
let styles = makeStyles();
// Stilurile se refac când se schimbă tema (Setări → Temă).
onThemeChange(() => {
  styles = makeStyles();
});
