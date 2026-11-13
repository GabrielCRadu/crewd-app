import { StyleSheet, View } from 'react-native';

import { palette } from '../../theme/eventsTheme';
import { getDistanceColor } from '../../utils/distance';

/** Bulina verde / galbenă / roșie în funcție de distanță. */
export default function DistanceDot({ km, size = 10 }: { km: number; size?: number }) {
  return (
    <View
      style={[
        styles.dot,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: getDistanceColor(km) },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  dot: { borderWidth: 1.5, borderColor: palette.ink },
});
