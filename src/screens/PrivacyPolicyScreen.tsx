import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import GlassIconButton from '../components/GlassIconButton';
import LegalText from '../components/LegalText';
import { tr, useLanguage } from '../i18n';
import { PRIVACY_POLICY_RO } from '../legal/privacyPolicy';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

/** Politica de confidențialitate (din Setări). Deocamdată există doar în română. */
export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const language = useLanguage();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <GlassIconButton icon="chevron-back" onPress={() => navigation.goBack()} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {language !== 'ro' ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>{tr('Politica de confidențialitate e disponibilă deocamdată doar în română.')}</Text>
          </View>
        ) : null}
        <LegalText markdown={PRIVACY_POLICY_RO} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  content: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  notice: { ...glass, borderRadius: radii.inner, padding: 14, marginBottom: 16 },
  noticeText: { color: colors.text, fontSize: 14 },
});
