import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import GlassIconButton from './GlassIconButton';
import LegalText from './LegalText';
import { tr, useLanguage } from '../i18n';
import { colors } from '../theme/colors';
import { glass, radii } from '../theme/shape';

/**
 * Pagina unui document juridic (politica de confidențialitate, termenii): butonul „înapoi” și textul.
 * Documentele există deocamdată doar în română; în engleză apare o notă despre asta.
 * Merge în orice stivă (Setări sau crearea contului), pentru că folosește doar „înapoi”.
 */
export default function LegalPage({ markdown }: { markdown: string }) {
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
            <Text style={styles.noticeText}>{tr('Documentul e disponibil deocamdată doar în română.')}</Text>
          </View>
        ) : null}
        <LegalText markdown={markdown} />
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
