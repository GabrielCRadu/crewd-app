import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import EventPoster from './EventPoster';
import GlassBadge from './GlassBadge';
import { getCategory } from '../../data/categories';
import type { EventWithDistance } from '../../types/events';
import { colors } from '../../theme/colors';
import { gradients } from '../../theme/gradients';
import { radii } from '../../theme/shape';
import { formatTime } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';

interface Props {
  event: EventWithDistance;
  onOpen: () => void;
}

/**
 * Cardul „ACUM”: afișul evenimentului pe tot cardul, cu informațiile puse peste el.
 * Sus: „ACUM” și distanța. Jos: categoria și locul, numele mare, până la ce oră ține
 * și „Vezi detalii”. Umbririle de sus și de jos țin textul lizibil pe orice poză.
 */
export default function NowCard({ event, onOpen }: Props) {
  const category = getCategory(event.category);

  return (
    <Pressable onPress={onOpen} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <EventPoster
        imageUrl={event.imageUrl}
        category={event.category}
        iconSize={40}
        style={[StyleSheet.absoluteFill, styles.posterPlaceholder]}
      />
      <LinearGradient colors={gradients.scrimTop} style={styles.scrimTop} />
      <LinearGradient colors={gradients.scrim} style={styles.scrimBottom} />

      {/* Sus: „ACUM” și distanța */}
      <View style={styles.top}>
        <GlassBadge icon="radio-button-on" label="ACUM" />
        <GlassBadge icon="navigate-outline" label={`la ${formatDistance(event.distanceKm)}`} />
      </View>

      {/* Jos: informațiile peste afiș */}
      <View style={styles.bottom}>
        <Text style={styles.eyebrow} numberOfLines={1}>
          {category.label.toUpperCase()} · {event.venueName}
        </Text>
        <Text style={styles.name} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.footer}>
          <Text style={styles.until}>Până la {formatTime(event.endsAt)}</Text>
          <Pressable onPress={onOpen} style={({ pressed }) => [styles.cta, pressed && styles.ctaPressed]}>
            <Text style={styles.ctaText}>Vezi detalii</Text>
            <Ionicons name="arrow-forward" size={16} color={colors.photo.onPill} />
          </Pressable>
        </View>
        {event.imageCredit ? <Text style={styles.credit}>Foto: {event.imageCredit}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 280,
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    backgroundColor: colors.photo.placeholder,
  },
  pressed: { opacity: 0.92 },
  // Locul afișului rămâne închis și pe tema deschisă: peste el stă text alb.
  posterPlaceholder: { backgroundColor: colors.photo.placeholder },
  scrimTop: { position: 'absolute', left: 0, right: 0, top: 0, height: '35%' },
  scrimBottom: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '75%' },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bottom: { gap: 6 },
  eyebrow: { color: colors.photo.text, opacity: 0.8, fontSize: 12, fontWeight: '700', letterSpacing: 1.2 },
  name: { color: colors.photo.text, fontSize: 26, lineHeight: 30, fontWeight: '700', letterSpacing: -0.6 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 6 },
  until: { color: colors.photo.text, opacity: 0.8, fontSize: 14, fontWeight: '500' },
  // Pastilă albă simplă (fără gradient), ca afișul să rămână singura culoare.
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 40,
    borderRadius: radii.pill,
    backgroundColor: colors.photo.pill,
  },
  ctaPressed: { opacity: 0.85 },
  ctaText: { color: colors.photo.onPill, fontSize: 14, fontWeight: '600' },
  credit: { color: colors.photo.faint, fontSize: 10, marginTop: 2 },
});
