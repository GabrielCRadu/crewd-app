import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import ScreenHeader from '../components/ScreenHeader';
import { colors } from '../theme/colors';

const CHATS = [
  { id: '1', name: 'Grup exemplu 1', last: 'Ultimul mesaj...', meetup: 'Meet-up: 19:00 · Locație' },
  { id: '2', name: 'Grup exemplu 2', last: 'Ultimul mesaj...', meetup: 'Meet-up: 18:30 · Locație' },
];

export default function ChatsScreen() {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScreenHeader title="Chat" subtitle="Grupuri și meet-up-uri" />
      <View style={styles.list}>
        {CHATS.map((c) => (
          <View key={c.id} style={styles.row}>
            <Ionicons name="people-circle-outline" size={44} color={colors.primary} />
            <View style={styles.text}>
              <Text style={styles.name}>{c.name}</Text>
              <Text style={styles.last}>{c.last}</Text>
              <Text style={styles.meetup}>{c.meetup}</Text>
            </View>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: 20, gap: 12, marginTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  text: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  last: { fontSize: 13, color: colors.muted, marginTop: 2 },
  meetup: { fontSize: 12, color: colors.primary, marginTop: 4, fontWeight: '600' },
});
