import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { fonts, palette, ui } from '../../theme/eventsTheme';
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

/** Cardul coral „ACUM” din machetă: cel mai apropiat eveniment în desfășurare. */
export default function LiveNowCard({ event, joined, onJoin, onOpen }: Props) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.outer, pressed && styles.pressed]}>
      <Raised color={ui.cta} radius={24} contentStyle={styles.card}>
        <View style={styles.top}>
          <LiveBadge />
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
  distance: { fontFamily: fonts.extrabold, fontSize: 15, color: palette.ink },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 32, color: palette.ink },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  meta: { flex: 1, fontFamily: fonts.semibold, fontSize: 15, color: palette.ink },
  button: {
    backgroundColor: palette.card,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  buttonText: { fontFamily: fonts.extrabold, fontSize: 15, color: palette.ink },
});
