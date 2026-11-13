import { Pressable, StyleSheet, Text, View } from 'react-native';

import Aurora from '../Aurora';
import GradientButton from '../GradientButton';
import GlassBadge from './GlassBadge';
import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import { formatTime } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';

interface Props {
  event: EventWithDistance;
  joined: boolean;
  onJoin: () => void;
  onOpen: () => void;
}

/** Cardul evidențiat „ACUM” (docs/layout-guide.md), desenat ca hero cu lumină aurora. */
export default function NowCard({ event, joined, onJoin, onOpen }: Props) {
  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <Aurora style={StyleSheet.absoluteFill} withScrim />

      {/* Sus: badge-ul „ACUM” și distanța */}
      <View style={styles.top}>
        <GlassBadge icon="radio-button-on" label="ACUM" />
        <Text style={styles.distance}>la {formatDistance(event.distanceKm)}</Text>
      </View>

      <Text style={styles.title} numberOfLines={2}>
        {event.title}
      </Text>

      {/* Jos: „Categorie · până la HH:MM” și „Vin și eu” */}
      <View style={styles.bottom}>
        <Text style={styles.meta} numberOfLines={1}>
          {getCategory(event.category).label} · până la {formatTime(event.endsAt)}
        </Text>
        {joined ? (
          <View style={styles.joined}>
            <Text style={styles.joinedText}>Înscris ✓</Text>
          </View>
        ) : (
          <GradientButton label="Vin și eu" compact onPress={onJoin} />
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 180,
    justifyContent: 'space-between',
    gap: 14,
    padding: 18,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.9 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  distance: { color: colors.text, fontSize: 14, fontWeight: '600' },
  title: { color: colors.text, fontSize: 26, fontWeight: '600', letterSpacing: -0.5 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  meta: { flex: 1, color: colors.muted, fontSize: 14 },
  joined: { ...glass, backgroundColor: colors.cardStrong, borderRadius: radii.pill, paddingHorizontal: 16, height: 42, justifyContent: 'center' },
  joinedText: { color: colors.text, fontWeight: '600' },
});
