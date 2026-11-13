import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { palette, ui } from '../../theme/eventsTheme';

interface Props {
  children: ReactNode;
  /** Culoarea de fundal a elementului. */
  color?: string;
  radius?: number;
  /** Cât de mult e decalată umbra (0 = fără umbră). */
  offset?: number;
  /** Stil pentru containerul exterior (margini, lățime, flex). */
  style?: StyleProp<ViewStyle>;
  /** Stil pentru interior (padding, flexDirection...). */
  contentStyle?: StyleProp<ViewStyle>;
}

/**
 * Element cu contur și umbră „tare” (ca în macheta din PDF).
 * Umbra e un View desenat în spatele conținutului, decalat în jos-dreapta,
 * așa că arată la fel pe iOS și pe Android.
 */
export default function Raised({
  children,
  color = palette.card,
  radius = ui.radius,
  offset = ui.shadowOffset,
  style,
  contentStyle,
}: Props) {
  return (
    <View style={[{ marginRight: offset, marginBottom: offset }, style]}>
      {offset > 0 ? (
        <View
          style={[
            styles.shadow,
            { top: offset, left: offset, right: -offset, bottom: -offset, borderRadius: radius },
          ]}
        />
      ) : null}
      <View style={[styles.content, { backgroundColor: color, borderRadius: radius }, contentStyle]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: { position: 'absolute', backgroundColor: ui.shadow },
  content: { borderWidth: ui.outlineWidth, borderColor: ui.outline, overflow: 'hidden' },
});
