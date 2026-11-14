import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '../../types/events';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';

/** Badge mic: pastilă de sticlă cu o iconiță înaintea textului (ex. „ACUM”, categoria). */
export default function GlassBadge({ label, icon }: { label: string; icon?: IconName }) {
  return (
    <View style={styles.badge}>
      {icon ? <Ionicons name={icon} size={12} color={colors.photo.text} /> : null}
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Stă peste poze: sticlă închisă și text alb, la fel pe ambele teme.
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.photo.glassBorder,
    backgroundColor: colors.photo.glass,
  },
  text: { color: colors.photo.text, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
});
