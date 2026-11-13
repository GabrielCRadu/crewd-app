import { Pressable, StyleSheet, Text, View } from 'react-native';

import Aurora from '../Aurora';
import GradientButton from '../GradientButton';
import GlassBadge from './GlassBadge';
import type { EventWithDistance } from '../../types/events';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';
import { formatDistance } from '../../utils/distance';

interface Props {
  event: EventWithDistance;
  onOpen: () => void;
}

/**
 * Cardul „ACUM”: sus badge-ul și distanța, la mijloc loc liber pentru imaginea evenimentului
 * (acum provizoriu: lumina aurora), jos numele evenimentului și „Vezi detalii”.
 */
export default function NowCard({ event, onOpen }: Props) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      {/* Locul imaginii: deocamdată aurora; mai târziu aici vine poza evenimentului. */}
      <Aurora style={StyleSheet.absoluteFill} withScrim />

      {/* Sus: badge-ul „ACUM” și distanța */}
      <View style={styles.top}>
        <GlassBadge icon="radio-button-on" label="ACUM" />
        <Text style={styles.distance}>la {formatDistance(event.distanceKm)}</Text>
      </View>

      {/* Jos: numele evenimentului (stânga) și „Vezi detalii” (dreapta) */}
      <View style={styles.bottom}>
        <Text style={styles.name} numberOfLines={2}>
          {event.title}
        </Text>
        <GradientButton label="Vezi detalii" icon="arrow-forward" compact onPress={onOpen} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 200,
    justifyContent: 'space-between',
    padding: 18,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distance: { color: colors.text, fontSize: 14, fontWeight: '600' },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '600', letterSpacing: -0.3 },
});
