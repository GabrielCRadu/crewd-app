import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '../../types/events';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';
import { tr } from '../../i18n';

/** Badge mic: pastilă de sticlă cu o iconiță înaintea textului (ex. „ACUM”, categoria). */
export default function GlassBadge({ label, icon }: { label: string; icon?: IconName }) {
  return (
    <View style={styles.badge}>
      {icon ? <Ionicons name={icon} size={12} color={colors.text} /> : null}
      <Text style={styles.text}>{tr(label)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // Sticlă mai opacă (cardStrong), ca să se citească și peste poze sau aurora.
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radii.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.cardStrong,
  },
  text: { color: colors.text, fontSize: 12, fontWeight: '600', letterSpacing: 0.4 },
});
