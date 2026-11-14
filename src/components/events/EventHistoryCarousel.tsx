import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GlassBadge from './GlassBadge';
import { useRatings } from '../../hooks/useRatings';
import { hasRated } from '../../services/ratingsService';
import { colors } from '../../theme/colors';
import { gradients } from '../../theme/gradients';
import { radii } from '../../theme/shape';
import type { Event } from '../../types/events';
import { formatShortDate } from '../../utils/dates';

interface Props {
  events: Event[];
  onOpen: (eventId: string) => void;
  /** Dacă e dat, fiecare carte are și pastila „+ Amintire” (istoricul tău). */
  onAddMemory?: (eventId: string) => void;
}

const CARD_WIDTH = 200;
const SIDE = 20;
const GAP = 12;

/**
 * Istoricul din Profil ca un carusel de cărți mici: poza evenimentului,
 * data sus, numele și pastila „Evaluează” / „Evaluat ✓” jos.
 */
export default function EventHistoryCarousel({ events, onOpen, onAddMemory }: Props) {
  const myRatings = useRatings();

  if (events.length === 0) {
    return <Text style={styles.empty}>Evenimentele la care mergi apar aici după ce se termină.</Text>;
  }

  return (
    <FlatList
      data={events}
      keyExtractor={(e) => e.id}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={CARD_WIDTH + GAP}
      decelerationRate="fast"
      style={styles.list}
      contentContainerStyle={styles.listContent}
      ItemSeparatorComponent={() => <View style={{ width: GAP }} />}
      renderItem={({ item }) => {
        const rated = hasRated(myRatings, item.id);
        return (
          <Pressable onPress={() => onOpen(item.id)} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
            {/* Poza evenimentului; până se încarcă (sau dacă lipsește) cardul rămâne închis la culoare */}
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            ) : null}
            <LinearGradient colors={gradients.scrim} style={styles.scrim} />

            <View style={styles.top}>
              <GlassBadge icon="calendar-outline" label={formatShortDate(item.startsAt)} />
            </View>

            <View style={styles.bottom}>
              <Text style={styles.title} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={styles.actions}>
                <View style={[styles.status, !rated && styles.statusTodo]}>
                  <Text style={[styles.statusText, !rated && styles.statusTextTodo]}>
                    {rated ? 'Evaluat ✓' : 'Evaluează'}
                  </Text>
                </View>
                {onAddMemory ? (
                  <Pressable
                    onPress={() => onAddMemory(item.id)}
                    hitSlop={6}
                    accessibilityRole="button"
                    accessibilityLabel={`Adaugă amintire de la ${item.title}`}
                    style={({ pressed }) => [styles.status, styles.memoryPill, pressed && styles.pressed]}
                  >
                    <Text style={styles.statusText}>+ Amintire</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  // Caruselul iese din padding-ul ecranului, ca să se tragă de la margine la margine.
  list: { marginHorizontal: -SIDE, flexGrow: 0 },
  listContent: { paddingHorizontal: SIDE },
  card: {
    width: CARD_WIDTH,
    height: 170,
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.photo.placeholder,
    overflow: 'hidden',
  },
  pressed: { opacity: 0.85 },
  scrim: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  top: { flexDirection: 'row' },
  bottom: { gap: 8 },
  title: { color: colors.photo.text, fontSize: 16, fontWeight: '600', letterSpacing: -0.2 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Fundal opac, ca pastila să se citească și peste afișe deschise la culoare.
  memoryPill: { backgroundColor: colors.photo.placeholder },
  status: { borderWidth: 1, borderColor: colors.photo.glassBorder, backgroundColor: colors.photo.glass, alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  statusTodo: { backgroundColor: colors.photo.pill, borderColor: colors.photo.pill },
  statusText: { fontSize: 12, fontWeight: '500', color: colors.photo.text },
  statusTextTodo: { color: colors.photo.onPill, fontWeight: '600' },
  empty: { fontSize: 13, color: colors.muted },
});
