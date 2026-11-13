import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { CategoryId, IconName } from '../../types/events';
import { CATEGORIES } from '../../data/categories';
import { colors } from '../../theme/colors';

interface Props {
  /** Categoriile selectate. Listă goală = „Toate”. */
  selected: CategoryId[];
  onChange: (selected: CategoryId[]) => void;
}

/** Chip-uri cu categorii; se pot selecta mai multe deodată. */
export default function CategoryChips({ selected, onChange }: Props) {
  // Apăsare pe o categorie: o adaugă dacă nu era selectată, altfel o scoate.
  const toggle = (id: CategoryId) => {
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);
  };

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      <Chip label="Toate" icon="apps-outline" active={selected.length === 0} onPress={() => onChange([])} />
      {CATEGORIES.map((c) => (
        <Chip
          key={c.id}
          label={c.label}
          icon={c.icon}
          active={selected.includes(c.id)}
          onPress={() => toggle(c.id)}
        />
      ))}
    </ScrollView>
  );
}

function Chip({ label, icon, active, onPress }: { label: string; icon: IconName; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Ionicons name={icon} size={16} color={active ? '#fff' : colors.primary} />
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  label: { fontWeight: '600', color: colors.text },
  labelActive: { color: '#fff' },
});
