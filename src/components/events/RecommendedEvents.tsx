import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EventWithDistance } from '../../types/events';
import { fonts, palette, ui } from '../../theme/eventsTheme';
import { formatEventDate } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import DistanceDot from './DistanceDot';
import Raised from './Raised';

interface Props {
  events: EventWithDistance[];
  onOpenEvent: (eventId: string) => void;
}

/** Rând orizontal cu carduri mici: „Recomandate pentru tine”. */
export default function RecommendedEvents({ events, onOpenEvent }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {events.map((e) => (
        <Pressable key={e.id} onPress={() => onOpenEvent(e.id)} style={({ pressed }) => pressed && styles.pressed}>
          <Raised radius={18} style={styles.card}>
            <Image source={{ uri: e.imageUrl }} style={styles.image} />
            <View style={styles.body}>
              <Text style={styles.title} numberOfLines={1}>
                {e.title}
              </Text>
              <Text style={styles.meta} numberOfLines={1}>
                {formatEventDate(e.startsAt)}
              </Text>
              <View style={styles.distance}>
                <DistanceDot km={e.distanceKm} size={8} />
                <Text style={styles.meta}>{formatDistance(e.distanceKm)}</Text>
              </View>
            </View>
          </Raised>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 10 },
  pressed: { opacity: 0.85 },
  card: { width: 176 },
  image: {
    width: '100%',
    height: 110,
    backgroundColor: ui.placeholder,
    borderBottomWidth: ui.outlineWidth,
    borderBottomColor: ui.outline,
  },
  body: { padding: 10, gap: 3 },
  title: { fontSize: 16, fontFamily: fonts.display, color: palette.ink },
  meta: { fontSize: 12, fontFamily: fonts.semibold, color: palette.muted },
  distance: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
