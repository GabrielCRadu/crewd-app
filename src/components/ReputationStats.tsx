import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { RATING_TAGS } from '../data/ratingTags';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import type { Reputation } from '../types/ratings';
import { tr } from '../i18n';

interface Props {
  reputation: Reputation;
}

/** Trei plăcuțe de sticlă cu totalurile primite după evenimente: De treabă · Punctual · Aș mai ieși. */
export default function ReputationStats({ reputation }: Props) {
  return (
    <View style={styles.row}>
      {RATING_TAGS.map((tag) => (
        <View key={tag.id} style={styles.tile}>
          <Ionicons name={tag.icon} size={18} color={colors.text} />
          <Text style={styles.value}>{reputation.tagCounts[tag.id]}</Text>
          <Text style={styles.label} numberOfLines={2}>
            {tag.id === 'again' ? tr('Aș mai ieși') : tag.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  tile: { ...glass, flex: 1, alignItems: 'center', gap: 4, paddingVertical: 14, paddingHorizontal: 8, borderRadius: radii.inner },
  value: { fontSize: 24, fontWeight: '600', color: colors.text },
  label: { fontSize: 12, color: colors.muted, textAlign: 'center' },
});
