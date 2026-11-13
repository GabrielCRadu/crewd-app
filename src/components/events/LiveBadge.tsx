import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../../theme/colors';

/** Badge-ul roșu „LIVE” pentru evenimentele în desfășurare. */
export default function LiveBadge() {
  return (
    <View style={styles.badge}>
      <View style={styles.dot} />
      <Text style={styles.text}>LIVE</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'flex-start',
    backgroundColor: colors.nope,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#fff' },
  text: { color: '#fff', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
});
