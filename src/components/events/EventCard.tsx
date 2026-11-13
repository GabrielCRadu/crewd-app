import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { fonts, palette, ui } from '../../theme/eventsTheme';
import { formatEventDate, isLive } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import { formatPrice, formatSocial } from '../../utils/format';
import DistanceDot from './DistanceDot';
import LiveBadge from './LiveBadge';
import Pill from './Pill';
import Raised from './Raised';

/**
 * Cardul din lista de evenimente. Ordinea e fixă:
 * 1. afiș, 2. nume, 3. dată și oră, 4. locație + distanță, 5. categorie, preț, prieteni.
 */
export default function EventCard({ event, onPress }: { event: EventWithDistance; onPress: () => void }) {
  const category = getCategory(event.category);
  const price = formatPrice(event.price);
  const social = formatSocial(event.friendsGoing.length, event.lookingForCompanyCount);

  return (
    <Pressable onPress={onPress} style={({ pressed }) => pressed && styles.pressed}>
      <Raised radius={24}>
        {/* 1. Afișul */}
        <View style={styles.imageWrap}>
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
            <Ionicons name="time-outline" size={16} color={palette.muted} />
            <Text style={styles.meta}>{formatEventDate(event.startsAt)}</Text>
          </View>

          {/* 4. Locația + distanța */}
          <View style={styles.row}>
            <Ionicons name="location-outline" size={16} color={palette.muted} />
            <Text style={[styles.meta, styles.venue]} numberOfLines={1}>
              {event.venueName}
            </Text>
            <DistanceDot km={event.distanceKm} />
            <Text style={styles.distance}>{formatDistance(event.distanceKm)}</Text>
          </View>

          {/* 5. Restul */}
          <View style={styles.footer}>
            <Pill label={category.label} icon={category.icon} size="sm" />
            {price ? <Text style={styles.price}>{price}</Text> : null}
          </View>
          {social ? (
            <View style={styles.social}>
              <Ionicons name="people" size={16} color={palette.ink} />
              <Text style={styles.socialText}>{social}</Text>
            </View>
          ) : null}
        </View>
      </Raised>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.85 },
  imageWrap: { borderBottomWidth: ui.outlineWidth, borderBottomColor: ui.outline },
  image: { width: '100%', aspectRatio: 16 / 10, backgroundColor: ui.placeholder },
  badge: { position: 'absolute', top: 12, left: 12 },
  body: { padding: 16, gap: 8 },
  title: { fontSize: 24, fontFamily: fonts.display, color: palette.ink, lineHeight: 28 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  meta: { fontSize: 14, fontFamily: fonts.semibold, color: palette.muted },
  venue: { flexShrink: 1 },
  distance: { fontSize: 14, fontFamily: fonts.extrabold, color: palette.ink },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { fontSize: 16, fontFamily: fonts.extrabold, color: palette.ink },
  social: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    padding: 10,
    borderRadius: 14,
    backgroundColor: palette.background,
  },
  socialText: { flex: 1, fontSize: 13, fontFamily: fonts.bold, color: palette.ink },
});
