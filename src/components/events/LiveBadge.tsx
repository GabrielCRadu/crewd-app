import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';
import { fonts, ui } from '../../theme/eventsTheme';

/** Badge-ul „ACUM” / „LIVE” pentru evenimentele în desfășurare. */
export default function LiveBadge({ label = 'LIVE', inverted = false }: { label?: string; inverted?: boolean }) {
  // inverted = pe fundal roșu (cardul „ACUM”), badge-ul devine închis la culoare.
  return (
    <View style={[styles.badge, inverted && styles.inverted]}>
      <View style={styles.dot} />
      <Text style={styles.text}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: ui.live,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: ui.outlineWidth,
    borderColor: colors.background,
  },
  inverted: { backgroundColor: colors.background, borderColor: colors.background },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.text },
  text: { color: colors.text, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 0.8 },
});
