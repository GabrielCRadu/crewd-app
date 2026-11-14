import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import GlassIconButton from './GlassIconButton';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { gradients } from '../theme/gradients';
import { radii } from '../theme/shape';
import { tr } from '../i18n';

interface Props {
  step: 1 | 2;
  /** La pasul 2: butonul „înapoi”; la pasul 1: logo-ul. */
  onBack?: () => void;
}

/** Antetul onboarding-ului (docs/layout-guide.md): logo / înapoi, „Pasul X din 2”, două bare de progres. */
export default function OnboardingHeader({ step, onBack }: Props) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {onBack ? <GlassIconButton icon="chevron-back" onPress={onBack} /> : <Text style={styles.logo}>{tr('crewd')}</Text>}
        <Text style={styles.step}>{tr('Pasul')}{' '}{step}{' '}{tr('din 2')}</Text>
      </View>
      <View style={styles.bars}>
        {[1, 2].map((n) =>
          n <= step ? (
            <LinearGradient key={n} colors={gradients.avatar} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.bar} />
          ) : (
            <View key={n} style={[styles.bar, styles.barEmpty]} />
          ),
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 44 },
  logo: { ...type.screenTitle, fontSize: 26 },
  step: { fontSize: 13, fontWeight: '500', color: colors.muted },
  bars: { flexDirection: 'row', gap: 8 },
  bar: { flex: 1, height: 6, borderRadius: radii.pill },
  barEmpty: { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});
