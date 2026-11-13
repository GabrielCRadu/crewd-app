import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../theme/colors';

const EVENTS = [
  { id: '1', title: 'Eveniment exemplu 1', meta: 'Azi, 19:00 · 1.2 km', live: true },
  { id: '2', title: 'Eveniment exemplu 2', meta: 'Mâine, 18:30 · 3.4 km', live: false },
  { id: '3', title: 'Eveniment exemplu 3', meta: 'Sâmbătă, 12:00 · 5.0 km', live: false },
];

export default function EventsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Evenimente" subtitle="În desfășurare și viitoare, în apropiere" />
      <View style={styles.toggle}>
        <Text style={[styles.toggleItem, styles.toggleActive]}>Listă</Text>
        <Text style={styles.toggleItem}>Hartă</Text>
      </View>
      <View style={styles.list}>
        {EVENTS.map((e) => (
          <View key={e.id} style={styles.card}>
            <Ionicons name="calendar-outline" size={28} color={colors.primary} />
            <View style={styles.cardText}>
              <Text style={styles.cardTitle}>{e.title}</Text>
              <Text style={styles.cardMeta}>{e.meta}</Text>
            </View>
            {e.live ? <Text style={styles.live}>LIVE</Text> : null}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  toggle: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
    marginHorizontal: 20,
    marginVertical: 8,
    backgroundColor: colors.border,
    borderRadius: 12,
    padding: 3,
  },
  toggleItem: {
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 10,
    color: colors.muted,
    fontWeight: '600',
    overflow: 'hidden',
  },
  toggleActive: { backgroundColor: colors.card, color: colors.text },
  list: { paddingHorizontal: 20, gap: 12, marginTop: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardText: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardMeta: { fontSize: 13, color: colors.muted, marginTop: 2 },
  live: {
    color: '#fff',
    backgroundColor: colors.nope,
    fontSize: 11,
    fontWeight: '800',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
});
