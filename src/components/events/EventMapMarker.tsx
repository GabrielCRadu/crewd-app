import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';

import EventPoster from './EventPoster';
import type { EventWithDistance } from '../../types/events';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';
import { getDistanceColor } from '../../utils/distance';

interface Props {
  event: EventWithDistance;
  selected: boolean;
  onPress: () => void;
}

const SIZE = 46;
const SIZE_SELECTED = 60;

/** Cât mai urmărește harta schimbările marcajului după ce s-a redesenat (ms). */
const SETTLE_MS = 500;

/**
 * Un eveniment pe hartă: afișul lui, mic, la locul evenimentului.
 * Conturul are culoarea distanței (aproape / mediu / departe); marcajul apăsat e mai mare.
 */
export default function EventMapMarker({ event, selected, onPress }: Props) {
  const [imageDone, setImageDone] = useState(false);
  // Pe Android un marcaj cu conținut propriu e „fotografiat” o singură dată. Îl lăsăm urmărit cât
  // se încarcă afișul și puțin după fiecare schimbare, apoi îl oprim (altfel harta se mișcă greu).
  // `look` descrie cum arată marcajul acum; cât timp nu e cel deja „așezat”, harta îl urmărește.
  const look = `${selected}|${imageDone}|${event.imageUrl}`;
  const [settledLook, setSettledLook] = useState<string | null>(null);
  useEffect(() => {
    const timer = setTimeout(() => setSettledLook(look), SETTLE_MS);
    return () => clearTimeout(timer);
  }, [look]);
  const tracking = settledLook !== look;

  const size = selected ? SIZE_SELECTED : SIZE;

  return (
    <Marker
      coordinate={event.location}
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={selected ? 2 : 1}
      tracksViewChanges={tracking}
      onPress={onPress}
    >
      <View
        style={[
          styles.frame,
          { width: size, height: size, borderColor: getDistanceColor(event.distanceKm) },
          selected && styles.frameSelected,
        ]}
      >
        <EventPoster
          imageUrl={event.imageUrl}
          category={event.category}
          iconSize={selected ? 24 : 18}
          style={styles.poster}
          onLoadEnd={() => setImageDone(true)}
        />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  frame: {
    borderWidth: 2,
    borderRadius: radii.icon,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  frameSelected: { borderWidth: 3 },
  poster: { flex: 1 },
});
