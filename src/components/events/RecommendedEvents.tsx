import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { EventWithDistance } from '../../types/events';
import { colors } from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { formatEventDate } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import DistanceDot from './DistanceDot';

interface Props {
  events: EventWithDistance[];
  onOpenEvent: (eventId: string) => void;
}

/** Rând orizontal cu carduri mici: „Recomandate pentru tine”. */
export default function RecommendedEvents({ events, onOpenEvent }: Props) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {events.map((e) => (
        <Pressable key={e.id} onPress={() => onOpenEvent(e.id)} style={styles.card}>
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
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // paddingBottom lasă loc umbrei, să nu fie tăiată.
  row: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  card: { width: 170, backgroundColor: colors.card, borderRadius: 16, overflow: 'hidden', ...cardShadow },
  image: { width: '100%', height: 110, backgroundColor: colors.border },
  body: { padding: 10, gap: 3 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.muted },
  distance: { flexDirection: 'row', alignItems: 'center', gap: 5 },
});
