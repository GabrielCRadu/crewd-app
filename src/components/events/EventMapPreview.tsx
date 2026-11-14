import { Pressable, StyleSheet, Text, View } from 'react-native';

import GlassIconButton from '../GlassIconButton';
import GradientButton from '../GradientButton';
import DistanceDot from './DistanceDot';
import EventPoster from './EventPoster';
import { getCategory } from '../../data/categories';
import type { EventWithDistance } from '../../types/events';
import { colors } from '../../theme/colors';
import { radii } from '../../theme/shape';
import { cardShadow } from '../../theme/shadows';
import { type } from '../../theme/typography';
import { formatEventDate } from '../../utils/dates';
import { formatDistance } from '../../utils/distance';
import { tr } from '../../i18n';

interface Props {
  event: EventWithDistance;
  onOpen: () => void;
  onClose: () => void;
}

/**
 * Mini-previzualizarea evenimentului apăsat pe hartă, în partea de jos a ecranului:
 * afișul, categoria, titlul, când și cât de departe e, locul, apoi „Vezi detalii”.
 */
export default function EventMapPreview({ event, onOpen, onClose }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        {/* Afișul și textul deschid și ele detaliile */}
        <Pressable onPress={onOpen} style={({ pressed }) => [styles.body, pressed && styles.pressed]}>
          <EventPoster imageUrl={event.imageUrl} category={event.category} iconSize={26} style={styles.poster} />
          <View style={styles.text}>
            <Text style={styles.category} numberOfLines={1}>
              {getCategory(event.category).label}
            </Text>
            <Text style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            <View style={styles.metaRow}>
              <Text style={styles.meta}>{formatEventDate(event.startsAt)} ·</Text>
              <DistanceDot km={event.distanceKm} />
              <Text style={styles.meta}>{formatDistance(event.distanceKm)}</Text>
            </View>
            <Text style={styles.meta} numberOfLines={1}>
              {event.venueName}
            </Text>
          </View>
        </Pressable>
        <GlassIconButton icon="close" size={36} round onPress={onClose} />
      </View>

      <GradientButton label={tr('Vezi detalii')} icon="arrow-forward" compact onPress={onOpen} />

      {/* Atribuirea afișului (obligatorie pentru imaginile din surse externe) */}
      {event.imageUrl && event.imageCredit ? <Text style={styles.credit}>{tr('Foto: {credit}', { credit: event.imageCredit })}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Suprafață opacă (surface), ca pe tab-ul Hartă: cardul translucid nu se citește bine peste hartă.
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 16,
    padding: 14,
    gap: 12,
    borderRadius: radii.card,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  top: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  body: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  pressed: { opacity: 0.7 },
  poster: { width: 84, height: 104, borderRadius: radii.inner },
  text: { flex: 1, gap: 4 },
  category: { ...type.label, fontSize: 11 },
  title: { color: colors.text, fontSize: 17, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  meta: { color: colors.muted, fontSize: 13 },
  credit: { color: colors.faint, fontSize: 10, textAlign: 'right' },
});
