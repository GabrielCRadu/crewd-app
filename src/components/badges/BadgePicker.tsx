import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { VOTED_BADGES } from '../../data/badges';
import { colors } from '../../theme/colors';
import type { VotedBadgeId } from '../../types/badges';
import { MAX_BADGES_PER_PERSON, canPropose } from '../../utils/badgeRules';
import BadgePill from './BadgePill';

interface Props {
  /** Badge-urile bifate pentru această persoană. */
  selected: VotedBadgeId[];
  onToggle: (badgeId: VotedBadgeId) => void;
}

/**
 * „Propune un badge” din „Cum a fost?”: un rând care se deschide și arată lista de badge-uri.
 * Poți bifa cel mult MAX_BADGES_PER_PERSON; restul se estompează când ai ajuns la limită.
 */
export default function BadgePicker({ selected, onToggle }: Props) {
  // Dacă ai propus deja ceva (revii să modifici), lista pornește deschisă.
  const [open, setOpen] = useState(selected.length > 0);

  return (
    <View style={styles.container}>
      <Pressable
        onPress={() => setOpen((o) => !o)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.header, pressed && styles.pressed]}
      >
        <Ionicons name="ribbon-outline" size={16} color={colors.text} />
        <Text style={styles.title}>Propune un badge</Text>
        <Text style={styles.count}>
          {selected.length} din {MAX_BADGES_PER_PERSON}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={16} color={colors.muted} />
      </Pressable>

      {open ? (
        <View style={styles.pills}>
          {VOTED_BADGES.map((badge) => (
            <BadgePill
              key={badge.id}
              label={badge.label}
              icon={badge.icon}
              selected={selected.includes(badge.id)}
              disabled={!canPropose(selected, badge.id)}
              onPress={() => onToggle(badge.id)}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.border },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pressed: { opacity: 0.7 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.text },
  count: { fontSize: 13, color: colors.muted },
  pills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
});
