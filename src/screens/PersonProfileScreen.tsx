import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import GlassIconButton from '../components/GlassIconButton';
import { PEOPLE } from '../data/mockSocial';
import { RATING_TAGS } from '../data/ratingTags';
import { useRatings } from '../hooks/useRatings';
import type { EventsStackParamList } from '../navigation/eventsTypes';
import { getReputation } from '../services/ratingsService';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

type Props = NativeStackScreenProps<EventsStackParamList, 'PersonProfile'>;

/**
 * Profilul altei persoane: identitatea, tag-urile ei și ce a strâns după evenimente.
 * Se văd doar totalurile (câte „De treabă”, câte rapoarte), niciodată cine le-a dat.
 */
export default function PersonProfileScreen({ navigation, route }: Props) {
  const person = PEOPLE.find((p) => p.id === route.params.personId);
  const myRatings = useRatings();

  if (!person) {
    return (
      <View style={styles.center}>
        <Text style={styles.muted}>Persoana nu a fost găsită.</Text>
      </View>
    );
  }

  const reputation = getReputation(myRatings, person.id);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.identity}>
          <Aurora style={StyleSheet.absoluteFill} />
          <View style={styles.identityRow}>
            <Avatar name={person.name} size={84} square />
            <Text style={styles.name}>
              {person.name}, {person.age}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>După evenimente</Text>
          <View style={styles.statsCard}>
            {RATING_TAGS.map((tag) => (
              <View key={tag.id} style={styles.statRow}>
                <Ionicons name={tag.icon} size={18} color={colors.text} />
                <Text style={styles.statLabel}>{tag.label}</Text>
                <Text style={styles.statValue}>{reputation.tagCounts[tag.id]}</Text>
              </View>
            ))}
            <View style={styles.divider} />
            <View style={styles.statRow}>
              <Ionicons
                name={reputation.reportsCount > 0 ? 'flag' : 'flag-outline'}
                size={18}
                color={reputation.reportsCount > 0 ? colors.nope : colors.muted}
              />
              <Text style={styles.statLabel}>Rapoarte</Text>
              <Text style={[styles.statValue, reputation.reportsCount > 0 && styles.reports]}>
                {reputation.reportsCount}
              </Text>
            </View>
          </View>
          <Text style={styles.muted}>Evaluările sunt anonime: se văd doar totalurile.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Îi place</Text>
          <View style={styles.tags}>
            {person.tags.map((t) => (
              <Chip key={t} label={t} />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 32, gap: 22 },
  identity: { ...glass, borderRadius: radii.card, overflow: 'hidden' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  name: { flex: 1, fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  statsCard: { ...glass, padding: 16, gap: 14, borderRadius: radii.card },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statLabel: { flex: 1, fontSize: 15, color: colors.text },
  statValue: { fontSize: 17, fontWeight: '600', color: colors.text },
  reports: { color: colors.nope },
  divider: { height: 1, backgroundColor: colors.border },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  muted: { fontSize: 13, color: colors.muted },
});
