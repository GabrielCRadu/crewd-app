import { View } from 'react-native';

import { getDistanceColor } from '../../utils/distance';

/** Bulina verde / galbenă / roșie în funcție de distanță (culori din colors.ts). */
export default function DistanceDot({ km, size = 8 }: { km: number; size?: number }) {
  return <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: getDistanceColor(km) }} />;
}
