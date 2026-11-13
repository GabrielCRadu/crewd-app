import { ScrollView, StyleSheet } from 'react-native';

import Chip from '../Chip';
import type { CategoryId } from '../../types/events';
import { CATEGORIES } from '../../data/categories';

interface Props {
  /** Categoriile selectate. Listă goală = „Toate”. */
  selected: CategoryId[];
  onChange: (selected: CategoryId[]) => void;
}

/** Chip-urile de categorii pe un singur rând, cu scroll orizontal. Se pot alege mai multe. */
export default function CategoryChips({ selected, onChange }: Props) {
  // Apăsare pe o categorie: o adaugă dacă nu era selectată, altfel o scoate.
  const toggle = (id: CategoryId) => {
    onChange(selected.includes(id) ? selected.filter((c) => c !== id) : [...selected, id]);
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      <Chip label="Toate" active={selected.length === 0} onPress={() => onChange([])} />
      {CATEGORIES.map((c) => (
        <Chip key={c.id} label={c.label} active={selected.includes(c.id)} onPress={() => toggle(c.id)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // flexGrow: 0 = rândul ia doar înălțimea chip-urilor, nu tot spațiul liber.
  scroll: { flexGrow: 0 },
  row: { paddingHorizontal: 20, gap: 8 },
});
