import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../theme/colors';

export default function DiscoverScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Descoperă" subtitle="Persoane cu gusturi similare" />
      <View style={styles.cardArea}>
        <View style={styles.card}>
          <Ionicons name="person-circle-outline" size={120} color={colors.muted} />
          <Text style={styles.name}>Nume, 25</Text>
          <View style={styles.tags}>
            {['#muzică', '#drumeții', '#board games'].map((t) => (
              <Text key={t} style={styles.tag}>
                {t}
              </Text>
            ))}
          </View>
        </View>
      </View>
      <View style={styles.actions}>
        <View style={[styles.actionBtn, { borderColor: colors.nope }]}>
          <Ionicons name="close" size={32} color={colors.nope} />
        </View>
        <View style={[styles.actionBtn, { borderColor: colors.like }]}>
          <Ionicons name="heart" size={30} color={colors.like} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  cardArea: { flex: 1, padding: 20 },
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  name: { fontSize: 24, fontWeight: '700', color: colors.text, marginTop: 8 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginTop: 12, gap: 8 },
  tag: {
    backgroundColor: colors.background,
    color: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    overflow: 'hidden',
    fontWeight: '600',
  },
  actions: { flexDirection: 'row', justifyContent: 'center', gap: 32, paddingBottom: 20 },
  actionBtn: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
