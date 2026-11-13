import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Chip from '../components/Chip';
import { MY_TAGS, PEOPLE } from '../data/mockSocial';
import { colors } from '../theme/colors';
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
        <Pressable style={styles.iconButton} hitSlop={8}>
          <Ionicons name="options-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.card}>
        <View style={styles.photo}>
          <Text style={styles.photoInitial}>{person.name[0]}</Text>
          <View style={styles.commonBadge}>
            <Text style={styles.commonBadgeText}>{commonTags.length} tag-uri comune</Text>
          </View>
        </View>

        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>
              {person.name}, {person.age}
            </Text>
            <Text style={styles.distance}>la {formatDistance(person.distanceKm)}</Text>
          </View>

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
        <Pressable onPress={next} style={({ pressed }) => [styles.nopeButton, pressed && styles.pressed]}>
          <Ionicons name="close" size={30} color={colors.text} />
        </Pressable>
        <Pressable onPress={next} style={({ pressed }) => [styles.likeButton, pressed && styles.pressed]}>
          <Ionicons name="heart-outline" size={22} color="#fff" />
          <Text style={styles.likeText}>Hai în crew</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  logo: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  card: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  photo: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.border },
  photoInitial: { fontSize: 120, fontWeight: '900', color: colors.muted },
  commonBadge: {
    position: 'absolute',
    top: 14,
    left: 14,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  commonBadgeText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  info: { padding: 18, gap: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  name: { fontSize: 26, fontWeight: '800', color: colors.text },
  distance: { fontSize: 14, color: colors.muted },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  going: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 14,
    backgroundColor: colors.background,
  },
  goingText: { flex: 1, color: colors.muted, fontSize: 14 },
  goingStrong: { color: colors.text, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 12, paddingVertical: 16 },
  nopeButton: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  likeButton: {
    flex: 1,
    height: 64,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primary,
  },
  likeText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  pressed: { opacity: 0.85 },
});
