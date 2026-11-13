import { useMemo } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import LiveBadge from '../components/events/LiveBadge';
import { getCategory } from '../data/categories';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined, joinEvent, leaveEvent } from '../services/preferencesService';
import { colors } from '../theme/colors';
import { cardShadow } from '../theme/shadows';
import { formatEventDateRange, isLive } from '../utils/dates';
import { formatDistance, getDistanceColor, haversineKm, regionForPoints } from '../utils/distance';
import { formatPrice } from '../utils/format';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetails'>;

/** Pagina de detalii a unui eveniment + înscrierea. */
export default function EventDetailsScreen({ route }: Props) {
  const { eventId } = route.params;
  const { events, loading } = useEvents();
  const location = useUserLocation();
  const preferences = usePreferences();

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Evenimentul nu a fost găsit.</Text>
      </View>
    );
  }

  const category = getCategory(event.category);
  const distanceKm = haversineKm(location.coords, event.location);
  const joined = isJoined(preferences, event.id);
  const price = formatPrice(event.price);

  // Deschide Google Maps (aplicația sau browserul) cu traseul până la eveniment.
  const openDirections = () => {
    const { latitude, longitude } = event.location;
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Afișul */}
        <View>
          <Image source={{ uri: event.imageUrl }} style={styles.poster} />
          {isLive(event) ? (
            <View style={styles.badge}>
              <LiveBadge />
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{event.title}</Text>

          <View style={styles.row}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.info}>{formatEventDateRange(event.startsAt, event.endsAt)}</Text>
          </View>
          <View style={styles.row}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <View style={styles.flex}>
              <Text style={styles.info}>{event.venueName}</Text>
              <Text style={styles.muted}>{event.address}</Text>
            </View>
          </View>

          {/* Categoria și tag-urile */}
          <View style={styles.tags}>
            <View style={[styles.tag, styles.categoryTag]}>
              <Ionicons name={category.icon} size={13} color="#fff" />
              <Text style={styles.categoryText}>{category.label}</Text>
            </View>
            {event.tags.map((t) => (
              <View key={t} style={styles.tag}>
                <Text style={styles.tagText}>#{t}</Text>
              </View>
            ))}
          </View>
          {joined ? (
            <Text style={styles.prefsNote}>✓ Tag-urile acestui eveniment au fost adăugate la preferințele tale.</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Despre</Text>
          <Text style={styles.description}>{event.description}</Text>

          {/* Harta mică: tu → eveniment */}
          <Text style={styles.sectionTitle}>Locație</Text>
          <View style={styles.mapCard}>
            <MapView
              // `key` re-creează harta când aflăm locația reală, ca să se centreze pe ambele puncte.
              key={`${location.coords.latitude},${location.coords.longitude}`}
              style={styles.miniMap}
              initialRegion={regionForPoints(location.coords, event.location)}
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              toolbarEnabled={false}
            >
              <Polyline
                coordinates={[location.coords, event.location]}
                strokeColor={colors.primary}
                strokeWidth={2}
                lineDashPattern={[6, 6]}
              />
              <Marker coordinate={event.location} pinColor={getDistanceColor(distanceKm)} title={event.venueName} />
              <Marker coordinate={location.coords} anchor={{ x: 0.5, y: 0.5 }} title="Tu">
                <View style={styles.userDot} />
              </Marker>
            </MapView>
            <View style={styles.mapFooter}>
              <View style={[styles.distanceDot, { backgroundColor: getDistanceColor(distanceKm) }]} />
              <Text style={styles.info}>{formatDistance(distanceKm)} de tine</Text>
              <Pressable onPress={openDirections} style={styles.directions}>
                <Ionicons name="navigate" size={14} color={colors.primary} />
                <Text style={styles.directionsText}>Google Maps</Text>
              </Pressable>
            </View>
          </View>

          {/* Cine merge */}
          <Text style={styles.sectionTitle}>Cine merge</Text>
          {event.friendsGoing.length > 0 ? (
            <View style={styles.friends}>
              {event.friendsGoing.map((name) => (
                <View key={name} style={styles.friend}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{name[0]}</Text>
                  </View>
                  <Text style={styles.friendName}>{name}</Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.muted}>Niciun prieten nu s-a înscris încă. Fii primul!</Text>
          )}
          {event.lookingForCompanyCount > 0 ? (
            <View style={styles.looking}>
              <Ionicons name="people" size={18} color={colors.primary} />
              <Text style={styles.lookingText}>
                {event.lookingForCompanyCount}{' '}
                {event.lookingForCompanyCount === 1 ? 'persoană caută' : 'persoane caută'} cu cine să meargă
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Bara de jos: preț + înscriere */}
      <View style={styles.bottomBar}>
        <View style={styles.flex}>
          {joined ? (
            <Pressable onPress={() => leaveEvent(event)} hitSlop={8}>
              <Text style={styles.cancel}>Anulează înscrierea</Text>
            </Pressable>
          ) : (
            <>
              <Text style={styles.muted}>Preț</Text>
              <Text style={styles.price}>{price || '–'}</Text>
            </>
          )}
        </View>
        <Pressable
          onPress={() => (joined ? undefined : joinEvent(event))}
          disabled={joined}
          style={({ pressed }) => [styles.joinButton, joined && styles.joinedButton, pressed && styles.pressed]}
        >
          <Text style={[styles.joinText, joined && styles.joinedText]}>{joined ? 'Înscris ✓' : 'Mă înscriu'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },
  poster: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.border },
  badge: { position: 'absolute', top: 16, left: 16 },
  body: { padding: 20, gap: 12 },
  title: { fontSize: 30, fontWeight: '800', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  info: { fontSize: 15, color: colors.text, fontWeight: '600' },
  muted: { fontSize: 13, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  tag: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  tagText: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  categoryTag: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.primary, borderColor: colors.primary },
  categoryText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  prefsNote: { fontSize: 12, color: colors.like, fontWeight: '600' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginTop: 12 },
  description: { fontSize: 15, lineHeight: 22, color: colors.text },
  mapCard: { backgroundColor: colors.card, borderRadius: 20, overflow: 'hidden', ...cardShadow },
  miniMap: { width: '100%', height: 180 },
  mapFooter: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 14 },
  distanceDot: { width: 10, height: 10, borderRadius: 5 },
  directions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: `${colors.primary}14`,
  },
  directionsText: { color: colors.primary, fontWeight: '700', fontSize: 13 },
  userDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#2D7FF9', borderWidth: 3, borderColor: '#fff' },
  friends: { flexDirection: 'row', flexWrap: 'wrap', gap: 14 },
  friend: { alignItems: 'center', gap: 4 },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}1F`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 18 },
  friendName: { fontSize: 12, color: colors.text },
  looking: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 14,
    backgroundColor: `${colors.primary}14`,
  },
  lookingText: { flex: 1, color: colors.primary, fontWeight: '700' },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.card,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  price: { fontSize: 18, fontWeight: '800', color: colors.text },
  cancel: { color: colors.nope, fontWeight: '600' },
  joinButton: { backgroundColor: colors.primary, paddingHorizontal: 28, paddingVertical: 14, borderRadius: 14 },
  joinedButton: { backgroundColor: `${colors.like}22` },
  joinText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  joinedText: { color: colors.like },
  pressed: { opacity: 0.85 },
});
