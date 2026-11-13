import type { MapStyleElement } from 'react-native-maps';

/**
 * Stil întunecat, monocrom (doar gri), pentru harta Google (Android), potrivit cu docs/design-language.md.
 * Se dă la <MapView customMapStyle={darkMapStyle} />. Pe iOS (Apple Maps) se folosește userInterfaceStyle="dark".
 */
export const darkMapStyle: MapStyleElement[] = [
  { elementType: 'geometry', stylers: [{ color: '#141414' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a8a8a' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#000000' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#262626' }] },
  { featureType: 'road', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#333333' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0b0b0b' }] },
  { featureType: 'landscape.natural', elementType: 'geometry', stylers: [{ color: '#171717' }] },
];
