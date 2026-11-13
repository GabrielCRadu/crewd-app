import { useEffect, useRef, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

import type { EventWithDistance, LatLng } from '../../types/events';
import { fonts, palette, ui } from '../../theme/eventsTheme';
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
import Raised from './Raised';

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
    <Raised style={styles.outer} radius={24} contentStyle={{ height }}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        userInterfaceStyle="light"
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
        <View style={styles.miniWrap}>
          <Raised radius={18} contentStyle={styles.miniCard}>
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
                <Ionicons name="close" size={18} color={palette.muted} />
              </Pressable>
              <Pressable onPress={() => onOpenEvent(selected.id)} style={styles.miniButton}>
                <Text style={styles.miniButtonText}>Vezi detalii</Text>
              </Pressable>
            </View>
          </Raised>
        </View>
      ) : null}
    </Raised>
  );
}

const styles = StyleSheet.create({
  outer: { marginLeft: 20, marginRight: 20 + ui.shadowOffset },
  legend: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    gap: 2,
    backgroundColor: palette.card,
    borderRadius: 999,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    padding: 3,
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  legendHidden: { opacity: 0.35 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontFamily: fonts.bold, color: palette.ink },
  legendTextHidden: { textDecorationLine: 'line-through' },
  emptyOverlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  emptyText: {
    backgroundColor: palette.card,
    color: palette.muted,
    fontFamily: fonts.bold,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    overflow: 'hidden',
  },
  miniWrap: { position: 'absolute', left: 12, right: 12, bottom: 12 },
  miniCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10 },
  miniImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: ui.placeholder,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
  },
  miniBody: { flex: 1, gap: 2 },
  miniTitle: { fontSize: 16, fontFamily: fonts.display, color: palette.ink },
  miniMeta: { fontSize: 12, fontFamily: fonts.semibold, color: palette.muted },
  miniDistance: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  miniActions: { alignItems: 'flex-end', gap: 8 },
  miniButton: {
    backgroundColor: ui.cta,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
  },
  miniButtonText: { color: palette.ink, fontFamily: fonts.extrabold, fontSize: 12 },
});
