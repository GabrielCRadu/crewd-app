import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { RatingTagInfo } from '../../types/ratings';
import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';

interface Props {
  tag: RatingTagInfo;
  selected: boolean;
  disabled?: boolean;
  onPress: () => void;
}

/** Un tag de evaluare („De treabă”, „Punctual”...): pastilă de sticlă, albă când e ales. */
export default function RatingTagToggle({ tag, selected, disabled = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.chip,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Ionicons name={tag.icon} size={15} color={selected ? colors.onLight : colors.text} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{tag.label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    ...glass,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.pill,
  },
  selected: { backgroundColor: colors.text, borderColor: colors.text },
  disabled: { opacity: 0.35 },
  pressed: { backgroundColor: colors.cardStrong },
  label: { color: colors.text, fontSize: 13, fontWeight: '500' },
  labelSelected: { color: colors.onLight, fontWeight: '600' },
});
