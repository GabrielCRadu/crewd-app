import { StyleSheet, Text, View } from 'react-native';

import { fonts, palette } from '../../theme/eventsTheme';

/** Badge-ul bleumarin „ACUM” (ca în machetă) pentru evenimentele în desfășurare. */
export default function LiveBadge({ label = 'ACUM' }: { label?: string }) {
  return (
    <View style={styles.badge}>
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
    backgroundColor: palette.ink,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
  },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: palette.coral },
  text: { color: palette.card, fontSize: 12, fontFamily: fonts.extrabold, letterSpacing: 0.8 },
});
