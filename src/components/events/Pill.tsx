import { Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { IconName } from '../../types/events';
import { fonts, palette, ui } from '../../theme/eventsTheme';

interface Props {
  label: string;
  active?: boolean;
  icon?: IconName;
  onPress?: () => void;
  /** 'sm' pentru tag-uri mici, 'md' pentru filtre. */
  size?: 'sm' | 'md';
}

/** Chip rotund cu contur (filtre, categorii, tag-uri). Selectat = galben, ca în machetă. */
export default function Pill({ label, active = false, icon, onPress, size = 'md' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.pill,
        size === 'sm' && styles.small,
        active && styles.active,
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={size === 'sm' ? 13 : 16} color={palette.ink} /> : null}
      <Text style={[styles.label, size === 'sm' && styles.labelSmall]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: ui.outlineWidth,
    borderColor: ui.outline,
    backgroundColor: palette.card,
  },
  small: { paddingHorizontal: 11, paddingVertical: 5 },
  active: { backgroundColor: ui.selected },
  pressed: { opacity: 0.8 },
  label: { fontFamily: fonts.extrabold, fontSize: 15, color: palette.ink },
  labelSmall: { fontSize: 13 },
});
