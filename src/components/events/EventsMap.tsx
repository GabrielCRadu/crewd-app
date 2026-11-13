import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import GlassIconButton from '../GlassIconButton';
import GradientButton from '../GradientButton';
import DistanceDot from './DistanceDot';
import type { EventWithDistance, LatLng } from '../../types/events';
import { colors } from '../../theme/colors';
import { darkMapStyle } from '../../theme/mapStyle';
import { radii } from '../../theme/shape';
import { cardShadow } from '../../theme/shadows';
import { formatEventDate } from '../../utils/dates';
import { formatDistance, getDistanceColor } from '../../utils/distance';

interface Props {
  events: EventWithDistance[];
  userLocation: LatLng;
  /** Afișăm punctul „tu ești aici” doar dacă avem locația reală. */
  showUserLocation: boolean;
  onOpenEvent: (eventId: string) => void;
}

/** Cât de mult se vede la început (în grade; ~0.1 ≈ 11 km), ca să încapă și evenimentele mai depărtate. */
const ZOOM_DELTA = 0.1;

/** Modul „Hartă” al tab-ului: pini colorați după distanță + card plutitor pentru pinul apăsat. */
export default function EventsMap({ events, userLocation, showUserLocation, onOpenEvent }: Props) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Când aflăm locația reală, mutăm harta acolo.
  useEffect(() => {
    mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }, 500);
  }, [userLocation.latitude, userLocation.longitude]);

  // Dacă evenimentul selectat dispare din filtre, ascundem și cardul.
  const selected = events.find((e) => e.id === selectedId) ?? null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        userInterfaceStyle="dark"
        customMapStyle={darkMapStyle}
      >
        {events.map((e) => (
          <Marker
            key={e.id}
            coordinate={e.location}
            pinColor={getDistanceColor(e.distanceKm)}
            onPress={() => setSelectedId(e.id)}
          />
        ))}
      </MapView>

      {events.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyText}>Niciun eveniment pentru categoriile alese</Text>
        </View>
      ) : null}

      {/* Cardul plutitor al pinului apăsat */}
      {selected ? (
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.cardText}>
              <Text style={styles.cardTitle} numberOfLines={1}>
                {selected.title}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.cardMeta}>{formatEventDate(selected.startsAt)} ·</Text>
                <DistanceDot km={selected.distanceKm} />
                <Text style={styles.cardMeta}>{formatDistance(selected.distanceKm)}</Text>
              </View>
            </View>
            <GlassIconButton icon="close" size={36} round onPress={() => setSelectedId(null)} />
          </View>
          <GradientButton label="Vezi detalii" icon="arrow-forward" compact onPress={() => onOpenEvent(selected.id)} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, marginTop: 12, backgroundColor: colors.backgroundAlt },
  emptyOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    color: colors.muted,
    backgroundColor: colors.surface,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radii.pill,
    overflow: 'hidden',
  },
  // Suprafață opacă (surface), ca pe tab-ul Hartă: sticla nu se citește bine peste hartă.
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
  cardText: { flex: 1, gap: 3 },
  cardTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMeta: { color: colors.muted, fontSize: 13 },
});
