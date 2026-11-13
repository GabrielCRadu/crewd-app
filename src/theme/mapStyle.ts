import type { MapStyleElement } from 'react-native-maps';

/**
 * Stil întunecat pentru harta Google (Android), potrivit cu docs/design-language.md.
 * Se dă la <MapView customMapStyle={darkMapStyle} />. Pe iOS (Apple Maps) se folosește userInterfaceStyle="dark".
 */
export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#15121c' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8e8a9c' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0b0a10' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#272233' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a2f4a' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e0c16' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#18141f' }] },
];
