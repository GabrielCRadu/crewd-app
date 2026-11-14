import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EventPoster from './EventPoster';
import type { EventWithDistance } from '../../types/events';
import { getCategory } from '../../data/categories';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import { formatTime, formatWeekdayShort } from '../../utils/dates';
import { tr } from '../../i18n';

interface Props {
  event: EventWithDistance;
  joined: boolean;
  onPress: () => void;
}

/**
 * Un rând din secțiunea „Urmează”: afișul mic în stânga (se vede înainte să deschizi evenimentul),
 * apoi titlul, ziua și ora, „Categorie (· Înscris)” și chevron. Doar negru, gri și alb:
 * culoarea o dă afișul.
 */
export default function UpcomingEventRow({ event, joined, onPress }: Props) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
      <View>
        <EventPoster imageUrl={event.imageUrl} category={event.category} iconSize={22} style={styles.poster} />
        {/* Înscris: o bifă albă pe colțul afișului */}
        {joined ? (
          <View style={styles.joinedBadge}>
            <Ionicons name="checkmark" size={13} color={colors.onLight} />
          </View>
        ) : null}
      </View>

      <View style={styles.text}>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <Text style={styles.when}>
          {formatWeekdayShort(event.startsAt)} {event.startsAt.getDate()} · {formatTime(event.startsAt)}
        </Text>
        <Text style={styles.category}>
          {getCategory(event.category).label}
          {joined ? tr(' · Înscris') : ''}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={20} color={colors.faint} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 10,
    borderRadius: radii.card,
  },
  pressed: { backgroundColor: colors.cardStrong },
  poster: { width: 76, height: 76, borderRadius: radii.inner },
  joinedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.text,
    borderWidth: 2,
    borderColor: colors.background,
  },
  text: { flex: 1, gap: 3 },
  title: { color: colors.text, fontSize: 16, fontWeight: '600' },
  when: { color: colors.text, opacity: 0.75, fontSize: 13, fontWeight: '500' },
  category: { color: colors.muted, fontSize: 12, fontWeight: '500' },
});
