import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useEvents } from '../../hooks/useEvents';
import { usePreferences } from '../../hooks/usePreferences';
import { useRatings } from '../../hooks/useRatings';
import { useUserLocation } from '../../hooks/useUserLocation';
import { isJoined } from '../../services/preferencesService';
import { hasRated } from '../../services/ratingsService';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import { formatShortDate, hasEnded } from '../../utils/dates';

interface Props {
  onOpen: (eventId: string) => void;
}

/**
 * „Istoricul tău” din Profil, vizibil doar pentru tine: evenimentele la care te-ai înscris
 * și care s-au terminat apar aici automat, cele mai recente primele.
 * Pentru fiecare se vede dacă i-ai evaluat deja pe oamenii cu care ai fost.
 */
export default function EventHistoryCard({ onOpen }: Props) {
  const location = useUserLocation();
  const { events } = useEvents(location.coords);
  const preferences = usePreferences();
  const myRatings = useRatings();

  const past = useMemo(
    () =>
      events
        .filter((e) => isJoined(preferences, e.id) && hasEnded(e))
        .sort((a, b) => b.startsAt.getTime() - a.startsAt.getTime()),
    [events, preferences],
  );

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Istoricul tău</Text>
      <View style={styles.privateRow}>
        <Ionicons name="lock-closed-outline" size={13} color={colors.muted} />
        <Text style={styles.hint}>Doar tu vezi această listă.</Text>
      </View>

      {past.length === 0 ? (
        <Text style={styles.hint}>Evenimentele la care mergi apar aici după ce se termină.</Text>
      ) : (
        past.map((e) => {
          const rated = hasRated(myRatings, e.id);
          return (
            <Pressable key={e.id} onPress={() => onOpen(e.id)} style={({ pressed }) => [styles.row, pressed && styles.pressed]}>
              <Text style={styles.date}>{formatShortDate(e.startsAt)}</Text>
              <Text style={styles.eventTitle} numberOfLines={1}>
                {e.title}
              </Text>
              <View style={[styles.status, !rated && styles.statusTodo]}>
                <Text style={[styles.statusText, !rated && styles.statusTextTodo]}>{rated ? 'Evaluat ✓' : 'Evaluează'}</Text>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { ...glass, gap: 10, padding: 18, borderRadius: radii.card },
  title: { fontSize: 16, fontWeight: '600', color: colors.text },
  privateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  hint: { fontSize: 13, color: colors.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  pressed: { opacity: 0.7 },
  date: { width: 50, fontSize: 13, fontWeight: '600', color: colors.muted },
  eventTitle: { flex: 1, fontSize: 15, fontWeight: '500', color: colors.text },
  status: { ...glass, paddingHorizontal: 10, paddingVertical: 5, borderRadius: radii.pill },
  statusTodo: { backgroundColor: colors.text, borderColor: colors.text },
  statusText: { fontSize: 12, fontWeight: '500', color: colors.muted },
  statusTextTodo: { color: colors.onLight, fontWeight: '600' },
});
