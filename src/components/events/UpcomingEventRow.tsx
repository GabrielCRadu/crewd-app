import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryId, EventWithDistance } from '../../types/events';
import { CATEGORIES, getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import { gradients } from '../../theme/gradients';
import { glass, radii } from '../../theme/shape';
import { formatTime, formatWeekdayShort } from '../../utils/dates';

interface Props {
  event: EventWithDistance;
  joined: boolean;
  onPress: () => void;
}

/** Fiecare categorie primește mereu aceeași nuanță caldă (portocaliu, roz, magenta, galben...). */
function tintFor(category: CategoryId) {
  const index = CATEGORIES.findIndex((c) => c.id === category);
  return gradients.cardTints[Math.max(0, index) % gradients.cardTints.length]!;
}

/**
 * Un rând din secțiunea „Urmează” (docs/layout-guide.md):
 * caseta de dată | titlu, ora, „Categorie (· Înscris)” | chevron.
 * Fundalul e sticlă cu o nuanță caldă discretă, în funcție de categorie.
 */
export default function UpcomingEventRow({ event, joined, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <LinearGradient
        colors={tintFor(event.category)}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Caseta de dată: albă (evidențiată) dacă ești înscris */}
      <View style={[styles.dateBox, joined && styles.dateBoxActive]}>
        <Text style={[styles.weekday, joined && styles.onLight]}>{formatWeekdayShort(event.startsAt)}</Text>
        <Text style={[styles.day, joined && styles.onLight]}>{event.startsAt.getDate()}</Text>
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={1}>
          {event.title}
        </Text>
        {/* Doar ora; locul și distanța apar în pagina de detalii */}
        <Text style={styles.meta}>{formatTime(event.startsAt)}</Text>
        <Text style={styles.category}>
          {getCategory(event.category).label}
          {joined ? ' · Înscris' : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    borderRadius: radii.card,
    overflow: 'hidden',
  },
  pressed: { backgroundColor: colors.cardStrong },
  dateBox: { ...glass, width: 58, height: 58, borderRadius: radii.inner, alignItems: 'center', justifyContent: 'center' },
  dateBoxActive: { backgroundColor: colors.text, borderColor: colors.text },
  weekday: { color: colors.muted, fontSize: 11, fontWeight: '600', letterSpacing: 0.5 },
  day: { color: colors.text, fontSize: 22, fontWeight: '600' },
  onLight: { color: colors.onLight },
  text: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  meta: { color: colors.muted, fontSize: 13 },
  category: { color: colors.muted, fontSize: 12, fontWeight: '500' },
});
