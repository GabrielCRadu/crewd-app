import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import DistanceDot from './DistanceDot';
import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import { formatTime, formatWeekdayShort } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';

interface Props {
  event: EventWithDistance;
  joined: boolean;
  onPress: () => void;
}

/**
 * Un rând din secțiunea „Urmează” (docs/layout-guide.md):
 * caseta de dată | titlu, „HH:MM · Loc · distanță”, „Categorie (· Înscris)” | chevron.
 */
export default function UpcomingEventRow({ event, joined, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      {/* Caseta de dată: albă (evidențiată) dacă ești înscris */}
      <View style={[styles.dateBox, joined && styles.dateBoxActive]}>
        <Text style={[styles.weekday, joined && styles.onLight]}>{formatWeekdayShort(event.startsAt)}</Text>
        <Text style={[styles.day, joined && styles.onLight]}>{event.startsAt.getDate()}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta} numberOfLines={1}>
            {formatTime(event.startsAt)} · {event.venueName} ·
          </Text>
          <DistanceDot km={event.distanceKm} />
          <Text style={styles.meta}>{formatDistance(event.distanceKm)}</Text>
        </View>
        <Text style={styles.category}>
          {getCategory(event.category).label}
          {joined ? ' · Înscris' : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 14, padding: 12, borderRadius: radii.card },
  pressed: { backgroundColor: colors.cardStrong },
  dateBox: { ...glass, width: 58, height: 58, borderRadius: radii.inner, alignItems: 'center', justifyContent: 'center' },
  dateBoxActive: { backgroundColor: colors.text, borderColor: colors.text },
  weekday: { color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  day: { color: colors.text, fontSize: 22, fontWeight: '600' },
  onLight: { color: colors.onLight },
  text: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { flexShrink: 1, color: colors.muted, fontSize: 13 },
  category: { color: colors.faint, fontSize: 12, fontWeight: '500' },
});
