import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import type { EventWithDistance, LatLng } from '../../types/events';
import { colors } from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import { formatEventDate } from '../../utils/dates';
import {
  DISTANCE_COLORS,
  DISTANCE_LEVELS,
  formatDistance,
  getDistanceColor,
  getDistanceLevel,
  type DistanceLevel,
} from '../../utils/distance';
import DistanceDot from './DistanceDot';

interface Props {
  events: EventWithDistance[];
  userLocation: LatLng;
  /** Afișăm punctul albastru „tu ești aici” doar dacă avem locația reală. */
  showUserLocation: boolean;
  height: number;
  onOpenEvent: (eventId: string) => void;
}

/** Cât de mult din oraș se vede la început (în grade; ~0.1 ≈ 11 km). */
const ZOOM_DELTA = 0.1;

/** Harta cu pini colorați după distanță + legendă (care e și filtru) + mini-card. */
export default function EventsMap({ events, userLocation, showUserLocation, height, onOpenEvent }: Props) {
  const mapRef = useRef<MapView>(null);
  const [hiddenLevels, setHiddenLevels] = useState<DistanceLevel[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Când aflăm locația reală, mutăm harta acolo.
  useEffect(() => {
    mapRef.current?.animateToRegion(
      { ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA },
      500,
    );
  }, [userLocation.latitude, userLocation.longitude]);

  const visible = events.filter((e) => !hiddenLevels.includes(getDistanceLevel(e.distanceKm)));
  // Dacă evenimentul selectat dispare din filtre, ascundem și mini-card-ul.
  const selected = visible.find((e) => e.id === selectedId) ?? null;

  const toggleLevel = (level: DistanceLevel) => {
    setHiddenLevels((prev) => (prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]));
  };

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {visible.map((e) => (
          <Marker
            key={e.id}
            coordinate={e.location}
            pinColor={getDistanceColor(e.distanceKm)}
            onPress={() => setSelectedId(e.id)}
          />
        ))}
      </MapView>

      {/* Legenda: apasă pe o culoare ca s-o ascunzi/afișezi */}
      <View style={styles.legend}>
        {DISTANCE_LEVELS.map(({ level, label }) => {
          const hidden = hiddenLevels.includes(level);
          return (
            <Pressable key={level} onPress={() => toggleLevel(level)} style={[styles.legendItem, hidden && styles.legendHidden]}>
              <View style={[styles.legendDot, { backgroundColor: DISTANCE_COLORS[level] }]} />
              <Text style={[styles.legendText, hidden && styles.legendTextHidden]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>

      {visible.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyText}>Niciun eveniment pentru filtrele alese</Text>
        </View>
      ) : null}

      {/* Mini-card-ul pinului apăsat */}
      {selected ? (
        <View style={styles.miniCard}>
          <Image source={{ uri: selected.imageUrl }} style={styles.miniImage} />
          <View style={styles.miniBody}>
            <Text style={styles.miniTitle} numberOfLines={1}>
              {selected.title}
            </Text>
            <Text style={styles.miniMeta}>{formatEventDate(selected.startsAt)}</Text>
            <View style={styles.miniDistance}>
              <DistanceDot km={selected.distanceKm} />
              <Text style={styles.miniMeta}>{formatDistance(selected.distanceKm)}</Text>
            </View>
          </View>
          <View style={styles.miniActions}>
            <Pressable onPress={() => setSelectedId(null)} hitSlop={10}>
              <Ionicons name="close" size={18} color={colors.muted} />
            </Pressable>
            <Pressable onPress={() => onOpenEvent(selected.id)} style={styles.miniButton}>
              <Text style={styles.miniButtonText}>Vezi detalii</Text>
            </Pressable>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.border,
  },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 14,
    padding: 4,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 10 },
  legendHidden: { opacity: 0.35 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600', color: colors.text },
  legendTextHidden: { textDecorationLine: 'line-through' },
  emptyOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    color: colors.muted,
    fontWeight: '600',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  miniCard: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 10,
    ...cardShadow,
  },
  miniImage: { width: 60, height: 60, borderRadius: 12, backgroundColor: colors.border },
  miniBody: { flex: 1, gap: 2 },
  miniTitle: { fontSize: 15, fontWeight: '800', color: colors.text },
  miniMeta: { fontSize: 12, color: colors.muted },
  miniDistance: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniActions: { alignItems: 'flex-end', gap: 8 },
  miniButton: { backgroundColor: colors.primary, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  miniButtonText: { color: '#fff', fontWeight: '700', fontSize: 12 },
});
