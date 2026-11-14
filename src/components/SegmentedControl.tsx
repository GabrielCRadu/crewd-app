import { useEffect, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';

import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';
import { tr } from '../i18n';

interface Props<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** Spațiul dintre marginea comutatorului și pastila albă. */
const PADDING = 4;

/**
 * Comutator cu segmente egale: activul e pastilă albă, restul sticlă (vezi docs/design-language.md).
 * La schimbare, pastila albă alunecă (cu un mic arc) până la segmentul ales.
 */
export default function SegmentedControl<T extends string>({ options, value, onChange }: Props<T>) {
  const index = Math.max(0, options.findIndex((o) => o.value === value));
  const [width, setWidth] = useState(0);
  // Lățimea unui segment: fără marginea subțire (glass) și fără spațiul interior.
  const segmentWidth = width > 0 ? (width - (PADDING + glass.borderWidth) * 2) / options.length : 0;

  // Poziția pastilei, în „segmente” (0, 1, 2…), ca să nu depindă de lățime.
  const position = useRef(new Animated.Value(index)).current;
  useEffect(() => {
    Animated.spring(position, { toValue: index, useNativeDriver: true, friction: 9, tension: 90 }).start();
  }, [index, position]);

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.container} onLayout={onLayout}>
      {segmentWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.pill,
            {
              width: segmentWidth,
              transform: [{ translateX: Animated.multiply(position, segmentWidth) }],
            },
          ]}
        />
      ) : null}
      {options.map((o, i) => {
        const active = i === index;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            style={styles.segment}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{tr(o.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { ...glass, flexDirection: 'row', borderRadius: radii.pill, padding: PADDING },
  // Pastila albă stă sub etichete și alunecă între segmente.
  pill: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: radii.pill,
    backgroundColor: colors.text,
  },
  segment: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: radii.pill },
  label: { color: colors.muted, fontWeight: '500' },
  labelActive: { color: colors.onLight, fontWeight: '600' },
});
