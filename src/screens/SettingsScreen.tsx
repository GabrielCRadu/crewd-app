import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import DeleteAccount from '../components/DeleteAccount';
import GlassIconButton from '../components/GlassIconButton';
import LanguageSwitch from '../components/LanguageSwitch';
import { useAuth } from '../context/AuthContext';
import type { ProfileStackParamList } from '../navigation/profileTypes';
import { colors } from '../theme/colors';
import { type } from '../theme/typography';
import { glass, radii } from '../theme/shape';
import { tr } from '../i18n';

/**
 * Setările contului (din meniul cu trei linii de pe profil).
 * Contul: emailul, ieșirea din cont (cu confirmare Da / Nu) și ștergerea definitivă.
 */
export default function SettingsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList, 'Settings'>>();
  const { user, signOut } = useAuth();

  const confirmSignOut = () =>
    Alert.alert(tr('Ești sigur că vrei să ieși din cont?'), tr('Te poți loga din nou oricând cu emailul și parola.'), [
      { text: tr('Nu'), style: 'cancel' },
      { text: tr('Da'), style: 'destructive', onPress: () => void signOut() },
    ]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>{tr('Setări')}</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Limba: toată aplicația trece pe limba aleasă */}
        <Text style={styles.label}>{tr('LIMBĂ')}</Text>
        <LanguageSwitch />

        {/* Documentele legale */}
        <Text style={[styles.label, styles.sectionGap]}>{tr('LEGAL')}</Text>
        <View style={styles.card}>
          <Pressable
            onPress={() => navigation.navigate('Terms')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          >
            <Ionicons name="document-text-outline" size={18} color={colors.text} />
            <Text style={styles.rowText}>{tr('Termeni și condiții')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
          <Pressable
            onPress={() => navigation.navigate('PrivacyPolicy')}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, styles.rowBorder, pressed && styles.pressed]}
          >
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.text} />
            <Text style={styles.rowText}>{tr('Politica de confidențialitate')}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.faint} />
          </Pressable>
        </View>

        <Text style={[styles.label, styles.sectionGap]}>{tr('CONT')}</Text>
        <View style={styles.card}>
          {user?.email ? (
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={18} color={colors.muted} />
              <Text style={styles.email} numberOfLines={1}>
                {user.email}
              </Text>
            </View>
          ) : null}
          <Pressable
            onPress={confirmSignOut}
            accessibilityRole="button"
            style={({ pressed }) => [styles.row, user?.email ? styles.rowBorder : null, pressed && styles.pressed]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.nope} />
            <Text style={styles.signOut}>{tr('Ieși din cont')}</Text>
          </Pressable>
        </View>

        {/* Ștergerea definitivă a contului (cere parola) */}
        <View style={styles.delete}>
          <DeleteAccount />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  title: { ...type.screenTitle, fontSize: 32 },
  content: { padding: 20, paddingTop: 8, gap: 10 },
  label: { ...type.label },
  sectionGap: { marginTop: 16 },
  card: { ...glass, borderRadius: radii.inner, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 15 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  pressed: { backgroundColor: colors.cardStrong },
  email: { flex: 1, color: colors.muted, fontSize: 15 },
  rowText: { flex: 1, color: colors.text, fontSize: 15, fontWeight: '500' },
  signOut: { color: colors.nope, fontSize: 15, fontWeight: '600' },
  delete: { alignItems: 'center', marginTop: 16 },
});
