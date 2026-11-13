import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';

import Avatar from '../components/Avatar';
import GradientButton from '../components/GradientButton';
import SegmentedControl from '../components/SegmentedControl';
import { placeMockEvents } from '../data/mockEvents';
import { isUpcomingOrLive } from '../utils/eventFilters';
import { FRIENDS, placeAround } from '../data/mockSocial';
import { useUserLocation } from '../hooks/useUserLocation';
import { colors } from '../theme/colors';
import { cardShadow } from '../theme/shadows';
import { darkMapStyle } from '../theme/mapStyle';
import { glass, radii } from '../theme/shape';
import { formatDistance, getDistanceColor, haversineKm } from '../utils/distance';

type Mode = 'friends' | 'events';

const ZOOM_DELTA = 0.04;

/** Tab-ul Hartă: prietenii (sau evenimentele) pe hartă + cardul prietenului selectat (vezi docs/layout-guide.md). */
export default function FriendsMapScreen() {
  const location = useUserLocation();
  const mapRef = useRef<MapView>(null);
  const [mode, setMode] = useState<Mode>('friends');
  const [selectedId, setSelectedId] = useState<string>(FRIENDS[0]!.id);
  const [isVisible, setIsVisible] = useState(true);

  // Prietenii mock stau în jurul locației dispozitivului; distanța se calculează de aici.
  const friends = useMemo(
    () =>
      FRIENDS.map((f) => {
        const coordinate = placeAround(location.coords, f.offset);
        return { ...f, coordinate, distanceKm: haversineKm(location.coords, coordinate) };
      }),
    [location.coords],
  );
  const selected = friends.find((f) => f.id === selectedId) ?? null;
  // Evenimentele mock stau și ele în jurul locației dispozitivului.
  const events = useMemo(() => placeMockEvents(location.coords).filter((e) => isUpcomingOrLive(e)), [location.coords]);

  // Când aflăm locația reală, mutăm harta acolo.
  useEffect(() => {
    mapRef.current?.animateToRegion({ ...location.coords, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }, 500);
  }, [location.coords.latitude, location.coords.longitude]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Hartă</Text>
        <SegmentedControl
          options={[
            { value: 'friends', label: 'Prieteni' },
            { value: 'events', label: 'Evenimente' },
          ]}
          value={mode}
          onChange={setMode}
        />
      </View>

      <View style={styles.mapWrap}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          initialRegion={{ ...location.coords, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
          showsUserLocation={location.status === 'granted'}
          showsMyLocationButton={false}
          toolbarEnabled={false}
          userInterfaceStyle="dark"
          customMapStyle={darkMapStyle}
        >
          {mode === 'friends'
            ? friends.map((f) => (
                <Marker key={f.id} coordinate={f.coordinate} onPress={() => setSelectedId(f.id)}>
                  <View style={styles.friendMarker}>
                    <Avatar name={f.name} size={selectedId === f.id ? 46 : 38} />
                    <Text style={styles.friendLabel}>{f.name}</Text>
                  </View>
                </Marker>
              ))
            : events.map((e) => (
                <Marker
                  key={e.id}
                  coordinate={e.location}
                  title={e.title}
                  description={e.venueName}
                  pinColor={getDistanceColor(haversineKm(location.coords, e.location))}
                />
              ))}
        </MapView>

        {mode === 'friends' && selected ? (
          <View style={styles.card}>
            <View style={styles.cardTop}>
              <Avatar name={selected.name} size={44} />
              <View style={styles.cardText}>
                <Text style={styles.cardName}>
                  {selected.name} · la {formatDistance(selected.distanceKm)}
                </Text>
                <Text style={styles.cardStatus}>{selected.status}</Text>
              </View>
            </View>
            <View style={styles.cardButtons}>
              <Pressable style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}>
                <Text style={styles.buttonText}>Scrie-i</Text>
              </Pressable>
              <GradientButton label="Vezi evenimentul" compact style={styles.buttonCta} />
            </View>
            <View style={styles.separator} />
            <View style={styles.visibilityRow}>
              <Text style={styles.visibilityText}>Locația mea e vizibilă pentru prieteni</Text>
              <Switch
                value={isVisible}
                onValueChange={setIsVisible}
                trackColor={{ true: colors.primary, false: colors.cardStrong }}
                thumbColor={colors.text}
              />
            </View>
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12, gap: 12 },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  mapWrap: { flex: 1, backgroundColor: colors.backgroundAlt },
  friendMarker: { alignItems: 'center', gap: 2 },
  friendLabel: {
    color: colors.text,
    backgroundColor: colors.surface,
    fontSize: 11,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 16,
    gap: 14,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardText: { flex: 1, gap: 2 },
  cardName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  cardStatus: { color: colors.muted, fontSize: 13 },
  cardButtons: { flexDirection: 'row', gap: 10 },
  button: { ...glass, flex: 1, alignItems: 'center', justifyContent: 'center', height: 42, borderRadius: radii.pill },
  buttonPressed: { backgroundColor: colors.cardStrong },
  buttonText: { color: colors.text, fontWeight: '500' },
  buttonCta: { flex: 1 },
  separator: { height: 1, backgroundColor: colors.border },
  visibilityRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  visibilityText: { flex: 1, color: colors.muted, fontSize: 13 },
});
