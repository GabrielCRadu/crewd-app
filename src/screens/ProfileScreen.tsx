import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import Aurora from '../components/Aurora';
import Avatar from '../components/Avatar';
import Chip from '../components/Chip';
import { MY_PROFILE } from '../data/mockSocial';
import { TAG_GROUPS } from '../data/tags';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

/** Tab-ul Profil: identitate, tag-uri alese și tag-uri învățate (vezi docs/layout-guide.md). */
export default function ProfileScreen() {
  const profile = MY_PROFILE;
  const [learned, setLearned] = useState(profile.learnedTags);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Profil</Text>
          <Pressable style={({ pressed }) => [styles.editButton, pressed && styles.pressed]}>
            <Text style={styles.editText}>Editează</Text>
          </Pressable>
        </View>

        <View style={styles.identity}>
          <Aurora style={StyleSheet.absoluteFill} />
          <View style={styles.identityRow}>
            <Avatar name={profile.name} size={84} square />
            <View style={styles.identityText}>
              <Text style={styles.name}>
                {profile.name}, {profile.age}
              </Text>
              <View style={styles.cityRow}>
                <Ionicons name="location-outline" size={16} color={colors.text} />
                <Text style={styles.city}>{profile.city}</Text>
              </View>
            </View>
          </View>
        </View>

        {TAG_GROUPS.map((group) => (
          <View key={group.id} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.label}</Text>
            <View style={styles.tags}>
              {profile.chosenTags[group.id].map((t) => (
                <Chip key={t} label={t} active />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.learnedCard}>
          <Text style={styles.learnedTitle}>Învățate din evenimentele tale</Text>
          <Text style={styles.learnedHint}>Tag-uri adăugate automat după înscrieri. Le poți scoate oricând.</Text>
          <View style={styles.tags}>
            {learned.map((t) => (
              <Chip key={t} label={t} dashed onRemove={() => setLearned((prev) => prev.filter((x) => x !== t))} />
            ))}
            {learned.length === 0 ? <Text style={styles.learnedHint}>Niciun tag învățat încă.</Text> : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 32, gap: 22 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 32, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  editButton: { ...glass, paddingHorizontal: 18, paddingVertical: 10, borderRadius: radii.pill },
  editText: { color: colors.text, fontWeight: '500' },
  pressed: { backgroundColor: colors.cardStrong },
  identity: { ...glass, borderRadius: radii.card, overflow: 'hidden' },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 18 },
  identityText: { flex: 1, gap: 6 },
  name: { fontSize: 28, fontWeight: '600', letterSpacing: -0.5, color: colors.text },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  city: { color: colors.text, fontSize: 15, opacity: 0.85 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: colors.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  learnedCard: { ...glass, gap: 10, padding: 18, borderRadius: radii.card },
  learnedTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
  learnedHint: { fontSize: 13, color: colors.muted },
});
