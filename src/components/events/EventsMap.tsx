import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView from 'react-native-maps';

import EventMapMarker from './EventMapMarker';
import EventMapPreview from './EventMapPreview';
import type { EventWithDistance, LatLng } from '../../types/events';
import { colorScheme, colors, isDark } from '../../theme/colors';
import { darkMapStyle } from '../../theme/mapStyle';
import { radii } from '../../theme/shape';
import { tr } from '../../i18n';

interface Props {
  events: EventWithDistance[];
  userLocation: LatLng;
  /** Afișăm punctul „tu ești aici” doar dacă avem locația reală. */
  showUserLocation: boolean;
  onOpenEvent: (eventId: string) => void;
}

/** Cât de mult se vede la început (în grade; ~0.1 ≈ 11 km), ca să încapă și evenimentele mai depărtate. */
const ZOOM_DELTA = 0.1;

/** Durata mișcării hărții spre evenimentul apăsat (ms). */
const FOCUS_MS = 350;

/**
 * Modul „Evenimente” al tab-ului Hartă: afișul fiecărui eveniment la locul lui (contur colorat după distanță)
 * și o mini-previzualizare jos pentru evenimentul apăsat.
 */
export default function EventsMap({ events, userLocation, showUserLocation, onOpenEvent }: Props) {
  const mapRef = useRef<MapView>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Când aflăm locația reală, mutăm harta acolo.
  useEffect(() => {
    mapRef.current?.animateToRegion({ ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }, 500);
  }, [userLocation.latitude, userLocation.longitude]);

  // Dacă evenimentul selectat dispare din filtre, ascundem și cardul.
  const selected = events.find((e) => e.id === selectedId) ?? null;

  // La apăsare, aducem evenimentul în centru, ca previzualizarea de jos să nu-l acopere.
  const select = (event: EventWithDistance) => {
    setSelectedId(event.id);
    mapRef.current?.animateCamera({ center: event.location }, { duration: FOCUS_MS });
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ ...userLocation, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        userInterfaceStyle={colorScheme}
        customMapStyle={isDark ? darkMapStyle : undefined}
        // O apăsare pe hartă (nu pe un eveniment) închide previzualizarea.
        onPress={(e) => {
          if (e.nativeEvent.action !== 'marker-press') setSelectedId(null);
        }}
      >
        {events.map((e) => (
          <EventMapMarker key={e.id} event={e} selected={e.id === selectedId} onPress={() => select(e)} />
        ))}
      </MapView>

      {events.length === 0 ? (
        <View style={styles.emptyOverlay} pointerEvents="none">
          <Text style={styles.emptyText}>{tr('Niciun eveniment pentru categoriile alese')}</Text>
        </View>
      ) : null}

      {/* Mini-previzualizarea evenimentului apăsat */}
      {selected ? (
        <EventMapPreview event={selected} onOpen={() => onOpenEvent(selected.id)} onClose={() => setSelectedId(null)} />
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
});
