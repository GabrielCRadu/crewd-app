import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { formatEventDate, isLive } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import { formatPrice, formatSocial } from '../../utils/format';
import DistanceDot from './DistanceDot';
import LiveBadge from './LiveBadge';

/**
 * Cardul din lista de evenimente. Ordinea e fixă:
 * 1. afiș, 2. nume, 3. dată și oră, 4. locație + distanță, 5. categorie, preț, prieteni.
 */
export default function EventCard({ event, onPress }: { event: EventWithDistance; onPress: () => void }) {
  const category = getCategory(event.category);
  const price = formatPrice(event.price);
  const social = formatSocial(event.friendsGoing.length, event.lookingForCompanyCount);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* 1. Afișul */}
      <View>
        <Image source={{ uri: event.imageUrl }} style={styles.image} />
        {isLive(event) ? (
          <View style={styles.badge}>
            <LiveBadge />
          </View>
        ) : null}
      </View>

      <View style={styles.body}>
        {/* 2. Numele */}
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>

        {/* 3. Data și ora */}
        <View style={styles.row}>
          <Ionicons name="time-outline" size={16} color={colors.muted} />
          <Text style={styles.meta}>{formatEventDate(event.startsAt)}</Text>
        </View>

        {/* 4. Locația + distanța */}
        <View style={styles.row}>
          <Ionicons name="location-outline" size={16} color={colors.muted} />
          <Text style={[styles.meta, styles.venue]} numberOfLines={1}>
            {event.venueName}
          </Text>
          <DistanceDot km={event.distanceKm} />
          <Text style={styles.distance}>{formatDistance(event.distanceKm)}</Text>
        </View>

        {/* 5. Restul */}
        <View style={styles.footer}>
          <View style={styles.pill}>
            <Ionicons name={category.icon} size={13} color={colors.primary} />
            <Text style={styles.pillText}>{category.label}</Text>
          </View>
          {price ? <Text style={styles.price}>{price}</Text> : null}
        </View>
        {social ? (
          <View style={styles.row}>
            <Ionicons name="people-outline" size={16} color={colors.primary} />
            <Text style={styles.social}>{social}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...cardShadow },
  pressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  image: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.border },
  badge: { position: 'absolute', top: 12, left: 12 },
  body: { padding: 16, gap: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 14, color: colors.muted },
  venue: { flexShrink: 1 },
  distance: { fontSize: 14, fontWeight: '700', color: colors.text },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: `${colors.primary}14`,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  pillText: { color: colors.primary, fontWeight: '700', fontSize: 12 },
  price: { fontSize: 15, fontWeight: '800', color: colors.text },
  social: { fontSize: 13, color: colors.primary, fontWeight: '600', flexShrink: 1 },
});
