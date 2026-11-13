import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import { fonts, ui } from '../../theme/eventsTheme';
import { formatTime } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import LiveBadge from './LiveBadge';
import Raised from './Raised';

interface Props {
  event: EventWithDistance;
  joined: boolean;
  onJoin: () => void;
  onOpen: () => void;
}

/** Cardul mare „ACUM” din machetă: cel mai apropiat eveniment în desfășurare. */
export default function LiveNowCard({ event, joined, onJoin, onOpen }: Props) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.outer, pressed && styles.pressed]}>
      <Raised color={ui.live} radius={24} contentStyle={styles.card}>
        <View style={styles.top}>
          <LiveBadge label="ACUM" inverted />
          <Text style={styles.distance}>la {formatDistance(event.distanceKm)}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.bottom}>
          <Text style={styles.meta} numberOfLines={1}>
            {getCategory(event.category).label} · până la {formatTime(event.endsAt)}
          </Text>
          {/* Înscriere direct din card; după înscriere butonul devine „Înscris ✓”. */}
          <Pressable onPress={joined ? undefined : onJoin} disabled={joined} style={styles.button}>
            <Text style={styles.buttonText}>{joined ? 'Înscris ✓' : 'Vin și eu'}</Text>
          </Pressable>
        </View>
      </Raised>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: { marginHorizontal: 20 },
  pressed: { opacity: 0.9 },
  card: { padding: 18, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distance: { fontFamily: fonts.extrabold, fontSize: 14, color: ui.onLive },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: ui.onLive },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  meta: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: ui.onLive },
  button: {
    backgroundColor: colors.card,
    borderWidth: ui.outlineWidth,
    borderColor: colors.background,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
});
