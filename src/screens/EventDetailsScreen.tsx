import { useMemo } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import BackButton from '../components/events/BackButton';
import LiveBadge from '../components/events/LiveBadge';
import Pill from '../components/events/Pill';
import Raised from '../components/events/Raised';
import { getCategory } from '../data/categories';
import { useEvents } from '../hooks/useEvents';
import { usePreferences } from '../hooks/usePreferences';
import { useUserLocation } from '../hooks/useUserLocation';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { isJoined, joinEvent, leaveEvent } from '../services/preferencesService';
import { colors } from '../theme/colors';
import { fonts, ui } from '../theme/eventsTheme';
import { formatEventDateRange, isLive } from '../utils/dates';
import { formatDistance, getDistanceColor, haversineKm, regionForPoints } from '../utils/distance';
import { formatPrice } from '../utils/format';

type Props = NativeStackScreenProps<EventsStackParamList, 'EventDetails'>;

/** Culori pentru avatarele prietenilor (se repetă dacă sunt mulți). */
const AVATAR_COLORS = [ui.accent, colors.card, ui.live];

/** „Ana merge”, „Ana și Mihai merg și ei”, „Ana, Mihai și încă 3 merg și ei”. */
function friendsText(names: string[]): string {
  if (names.length === 1) return `${names[0]} merge`;
  if (names.length <= 3) return `${names.slice(0, -1).join(', ')} și ${names[names.length - 1]} merg și ei`;
  return `${names.slice(0, 2).join(', ')} și încă ${names.length - 2} merg și ei`;
}

/** Pagina de detalii a unui eveniment + înscrierea. */
export default function EventDetailsScreen({ navigation, route }: Props) {
  const { eventId } = route.params;
  const { events, loading } = useEvents();
  const location = useUserLocation();
  const preferences = usePreferences();
  const insets = useSafeAreaInsets();

  const event = useMemo(() => events.find((e) => e.id === eventId) ?? null, [events, eventId]);

  if (loading || !event) {
    return (
      <View style={styles.center}>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <Text style={styles.muted}>Evenimentul nu a fost găsit.</Text>
        )}
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
        {/* Afișul, cu butonul „înapoi” și categoria peste el */}
        <View style={styles.hero}>
          <Image source={{ uri: event.imageUrl }} style={styles.poster} />
          <View style={[styles.back, { top: insets.top + 8 }]}>
            <BackButton onPress={() => navigation.goBack()} />
          </View>
          <View style={styles.heroBottom}>
            <Pill label={category.label} icon={category.icon} active size="sm" />
            {isLive(event) ? <LiveBadge label="ACUM" /> : null}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{event.title}</Text>

          {/* Când / Unde */}
          <View style={styles.infoRow}>
            <Raised style={styles.flex} radius={18} offset={0} contentStyle={styles.infoBox}>
              <Text style={styles.infoLabel}>Când</Text>
              <Text style={styles.infoValue}>{formatEventDateRange(event.startsAt, event.endsAt)}</Text>
            </Raised>
            <Raised style={styles.flex} radius={18} offset={0} contentStyle={styles.infoBox}>
              <Text style={styles.infoLabel}>Unde</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {event.venueName}
              </Text>
              <Text style={styles.muted}>{formatDistance(distanceKm)} de tine</Text>
            </Raised>
          </View>

          <Text style={styles.description}>{event.description}</Text>

          {/* Tag-uri */}
          <View style={styles.tags}>
            {event.tags.map((t) => (
              <Pill key={t} label={`#${t}`} size="sm" />
            ))}
          </View>
          {joined ? (
            <Text style={styles.prefsNote}>✓ Tag-urile acestui eveniment au fost adăugate la preferințele tale.</Text>
          ) : null}

          {/* Cine merge */}
          {event.friendsGoing.length > 0 ? (
            <View style={styles.friendsRow}>
              <View style={styles.avatars}>
                {event.friendsGoing.slice(0, 4).map((name, i) => {
                  const bg = AVATAR_COLORS[i % AVATAR_COLORS.length];
                  return (
                    <View key={name} style={[styles.avatar, { backgroundColor: bg, marginLeft: i === 0 ? 0 : -12 }]}>
                      <Text style={[styles.avatarText, { color: bg === colors.card ? colors.text : colors.background }]}>
                        {name[0]}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text style={styles.friendsText}>{friendsText(event.friendsGoing)}</Text>
            </View>
          ) : (
            <Text style={styles.muted}>Niciun prieten nu s-a înscris încă. Fii primul!</Text>
          )}
          {event.lookingForCompanyCount > 0 ? (
            <Raised radius={18} offset={0} contentStyle={styles.looking}>
              <Ionicons name="people" size={20} color={ui.accent} />
              <Text style={styles.lookingText}>
                {event.lookingForCompanyCount}{' '}
                {event.lookingForCompanyCount === 1 ? 'persoană caută' : 'persoane caută'} cu cine să meargă
              </Text>
            </Raised>
          ) : null}

          {/* Harta mică: tu → eveniment */}
          <Text style={styles.sectionTitle}>Locație</Text>
          <Raised radius={22}>
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
              userInterfaceStyle="dark"
            >
              <Polyline
                coordinates={[location.coords, event.location]}
                strokeColor={ui.accent}
                strokeWidth={3}
                lineDashPattern={[6, 6]}
              />
              <Marker coordinate={event.location} pinColor={getDistanceColor(distanceKm)} title={event.venueName} />
              <Marker coordinate={location.coords} anchor={{ x: 0.5, y: 0.5 }} title="Tu">
                <View style={styles.userDot} />
              </Marker>
            </MapView>
            <View style={styles.mapFooter}>
              <View style={styles.flex}>
                <Text style={styles.infoValue}>{formatDistance(distanceKm)} de tine</Text>
                <Text style={styles.muted} numberOfLines={1}>
                  {event.address}
                </Text>
              </View>
              <Pressable onPress={openDirections} style={styles.directions}>
                <Ionicons name="navigate" size={14} color={colors.text} />
                <Text style={styles.directionsText}>Google Maps</Text>
              </Pressable>
            </View>
          </Raised>
        </View>
      </ScrollView>

      {/* Bara de jos: înscriere */}
      <View style={styles.bottomBar}>
        {joined ? (
          <View style={styles.joinedRow}>
            <Raised color={colors.card} radius={22} style={styles.flex} contentStyle={styles.ctaInner}>
              <Text style={[styles.ctaText, { color: colors.like }]}>Înscris ✓</Text>
            </Raised>
            <Pressable onPress={() => leaveEvent(event)} hitSlop={8}>
              <Text style={styles.cancel}>Anulează</Text>
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => joinEvent(event)} style={({ pressed }) => pressed && styles.pressed}>
            <Raised color={ui.accent} radius={22} contentStyle={styles.ctaInner}>
              <Text style={styles.ctaText}>Mă înscriu{price ? ` · ${price}` : ''}</Text>
            </Raised>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  content: { paddingBottom: 24 },
  flex: { flex: 1 },
  hero: { borderBottomWidth: ui.outlineWidth, borderBottomColor: ui.outline },
  poster: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.border },
  back: { position: 'absolute', left: 20 },
  heroBottom: { position: 'absolute', left: 20, bottom: 16, flexDirection: 'row', gap: 8, alignItems: 'center' },
  body: { padding: 20, gap: 14 },
  title: { fontFamily: fonts.display, fontSize: 34, lineHeight: 38, color: colors.text, letterSpacing: -0.5 },
  infoRow: { flexDirection: 'row', gap: 12 },
  infoBox: { padding: 14, gap: 2, flexGrow: 1 },
  infoLabel: { fontFamily: fonts.bold, fontSize: 13, color: colors.muted },
  infoValue: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.text },
  muted: { fontFamily: fonts.semibold, fontSize: 13, color: colors.muted },
  description: { fontFamily: fonts.semibold, fontSize: 16, lineHeight: 23, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  prefsNote: { fontFamily: fonts.bold, fontSize: 12, color: colors.like },
  friendsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatars: { flexDirection: 'row' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: ui.outlineWidth,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.extrabold, fontSize: 17 },
  friendsText: { flex: 1, fontFamily: fonts.extrabold, fontSize: 14, color: colors.text },
  looking: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 },
  lookingText: { flex: 1, fontFamily: fonts.bold, fontSize: 14, color: colors.text },
  sectionTitle: { fontFamily: fonts.display, fontSize: 22, color: colors.text, marginTop: 8 },
  miniMap: { width: '100%', height: 180 },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
    borderTopWidth: ui.outlineWidth,
    borderTopColor: ui.outline,
  },
  directions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
  },
  directionsText: { fontFamily: fonts.extrabold, fontSize: 13, color: colors.text },
  userDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#2D7FF9', borderWidth: 3, borderColor: '#fff' },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
    backgroundColor: colors.background,
    borderTopWidth: ui.outlineWidth,
    borderTopColor: ui.outline,
  },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ctaInner: { alignItems: 'center', justifyContent: 'center', paddingVertical: 18 },
  ctaText: { fontFamily: fonts.display, fontSize: 20, color: ui.onAccent },
  cancel: { fontFamily: fonts.extrabold, fontSize: 15, color: colors.nope },
  pressed: { opacity: 0.85 },
});
