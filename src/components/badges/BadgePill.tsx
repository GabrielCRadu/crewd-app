import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../../theme/colors';
import { glass, radii } from '../../theme/shape';
import type { IconName } from '../../types/events';

interface Props {
  label: string;
  icon: IconName;
  /** Pastilă albă: badge bifat în „Cum a fost?”. */
  selected?: boolean;
  /** Estompat și neapăsabil (ai atins numărul maxim de badge-uri). */
  disabled?: boolean;
  /** Fără `onPress` e doar afișat (pe profil). */
  onPress?: () => void;
}

/** Un badge: pastilă gri cu iconiță, albă când e bifată (vezi docs/design-language.md). */
export default function BadgePill({ label, icon, selected = false, disabled = false, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress || disabled}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityState={onPress ? { selected, disabled } : undefined}
      style={({ pressed }) => [
        styles.pill,
        selected && styles.selected,
        disabled && styles.disabled,
        pressed && !selected && styles.pressed,
      ]}
    >
      <Ionicons name={icon} size={15} color={selected ? colors.onLight : colors.text} />
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
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
