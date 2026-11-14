import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '../theme/colors';
import { PASSWORD_RULES, passwordChecks } from '../utils/passwordRules';
import { tr } from '../i18n';

/** Cerințele parolei, sub câmp: fiecare se bifează pe măsură ce scrii. */
export default function PasswordChecklist({ password }: { password: string }) {
  const checks = passwordChecks(password);
  return (
    <View style={styles.list}>
      {PASSWORD_RULES.map((rule) => {
        const ok = checks[rule.key];
        return (
          <View key={rule.key} style={styles.row} accessibilityLabel={`${tr(rule.label)}: ${ok ? tr('îndeplinit') : tr('neîndeplinit')}`}>
            <Ionicons name={ok ? 'checkmark-circle' : 'ellipse-outline'} size={16} color={ok ? colors.like : colors.faint} />
            <Text style={[styles.text, ok && styles.textOk]}>{tr(rule.label)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6, marginTop: -6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  text: { color: colors.muted, fontSize: 13 },
  textOk: { color: colors.text },
});
