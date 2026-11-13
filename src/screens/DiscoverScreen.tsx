import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Aurora from '../components/Aurora';
import Chip from '../components/Chip';
import GlassIconButton from '../components/GlassIconButton';
import GradientButton from '../components/GradientButton';
import { MY_TAGS, PEOPLE } from '../data/mockSocial';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { formatDistance } from '../utils/distance';

/** Tab-ul Descoperă: un card de profil pe rând, cu „✕” și „Hai în crew” (vezi docs/layout-guide.md). */
export default function DiscoverScreen() {
  const [index, setIndex] = useState(0);
  const person = PEOPLE[index % PEOPLE.length]!;
  const commonTags = person.tags.filter((t) => MY_TAGS.includes(t));
  // Tag-urile comune primele, ca să se vadă ce vă leagă.
  const sortedTags = [...commonTags, ...person.tags.filter((t) => !commonTags.includes(t))];
  const next = () => setIndex((i) => i + 1);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.logo}>crewd</Text>
        <GlassIconButton icon="options-outline" />
      </View>

      <View style={styles.card}>
        {/* Zona foto: aurora până avem poze reale */}
        <View style={styles.photo}>
          <Aurora style={StyleSheet.absoluteFill} withScrim />
          <View style={styles.commonBadge}>
            <Ionicons name="sparkles" size={12} color={colors.text} />
            <Text style={styles.commonBadgeText}>{commonTags.length} tag-uri comune</Text>
          </View>
          <View style={styles.nameBlock}>
            <View style={styles.nameRow}>
              <Text style={styles.name}>
                {person.name}, {person.age}
              </Text>
              <Text style={styles.distance}>la {formatDistance(person.distanceKm)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.tags}>
            {sortedTags.map((t) => (
              <Chip key={t} label={t} active={commonTags.includes(t)} />
            ))}
          </View>

          {person.goingTo ? (
            <View style={styles.going}>
              <Ionicons name="calendar-outline" size={18} color={colors.muted} />
              <Text style={styles.goingText}>
                Merge și la <Text style={styles.goingStrong}>{person.goingTo.title}</Text>, {person.goingTo.when}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.actions}>
        <GlassIconButton icon="close" size={58} round onPress={next} />
        <GradientButton label="Hai în crew" icon="heart" iconFirst onPress={next} style={styles.like} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  logo: { fontSize: 28, fontWeight: '600', color: colors.text, letterSpacing: -1 },
  card: { ...glass, flex: 1, borderRadius: radii.card, overflow: 'hidden' },
  photo: { flex: 1, justifyContent: 'flex-end' },
  commonBadge: {
    ...glass,
    position: 'absolute',
    top: 14,
    left: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.cardStrong,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.pill,
  },
  commonBadgeText: { color: colors.text, fontWeight: '500', fontSize: 12 },
  nameBlock: { padding: 18 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { fontSize: 30, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  distance: { fontSize: 14, color: colors.muted },
  info: { padding: 18, paddingTop: 4, gap: 12 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  going: { ...glass, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: radii.inner },
  goingText: { flex: 1, color: colors.muted, fontSize: 14 },
  goingStrong: { color: colors.text, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 16 },
  like: { flex: 1 },
});
