import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Comutator cu segmente egale: activul e pastilă albă, restul sticlă (vezi docs/design-language.md). */
export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  return (
    <View style={styles.container}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable key={o.value} onPress={() => onChange(o.value)} style={[styles.segment, active && styles.active]}>
            <Text style={[styles.label, active && styles.labelActive]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...glass, flexDirection: 'row', borderRadius: radii.pill, padding: 4 },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.pill },
  active: { backgroundColor: colors.text },
  label: { color: colors.muted, fontWeight: '500' },
  labelActive: { color: colors.onLight, fontWeight: '600' },
});
