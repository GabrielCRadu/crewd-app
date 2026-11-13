import { ScrollView, StyleSheet } from 'react-native';

import type { CategoryId } from '../../types/events';
import { CATEGORIES } from '../../data/categories';
import Pill from './Pill';

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
      <Pill label="Toate" icon="apps-outline" active={selected.length === 0} onPress={() => onChange([])} />
      {CATEGORIES.map((c) => (
        <Pill
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

const styles = StyleSheet.create({
  row: { paddingHorizontal: 20, gap: 8 },
});
