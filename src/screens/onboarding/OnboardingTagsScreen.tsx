import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import Chip from '../../components/Chip';
import FormMessage from '../../components/FormMessage';
import GradientButton from '../../components/GradientButton';
import OnboardingHeader from '../../components/OnboardingHeader';
import ScreenGlow from '../../components/ScreenGlow';
import { useAuth } from '../../context/AuthContext';
import { TAG_GROUPS } from '../../data/tags';
import type { OnboardingStackParamList } from '../../navigation/authTypes';
import { UsernameTakenError } from '../../services/usernamesService';
import { colors } from '../../theme/colors';
import { type } from '../../theme/typography';
import type { TagGroup } from '../../types/social';
import { tr } from '../../i18n';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'OnboardingTags'>;

/** Câte tag-uri trebuie alese, ca recomandările să aibă de unde porni. */
const MIN_TAGS = 3;

type Selection = Record<TagGroup['id'], string[]>;

/**
 * Onboarding, pasul 3 din 3: „Ce îți place?” (docs/layout-guide.md).
 * Trei grupuri de tag-uri (alegere multiplă) → „Gata, hai în Crewd” → profilul se salvează în Firestore.
 */
export default function OnboardingTagsScreen({ navigation, route }: Props) {
  const { identity, photoUrl } = route.params;
  const { completeOnboarding } = useAuth();
  const [selected, setSelected] = useState<Selection>({ events: [], music: [], hobbies: [] });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = selected.events.length + selected.music.length + selected.hobbies.length;

  const toggle = (group: TagGroup['id'], tag: string) => {
    setSelected((prev) => ({
      ...prev,
      [group]: prev[group].includes(tag) ? prev[group].filter((t) => t !== tag) : [...prev[group], tag],
    }));
  };

  const save = async () => {
    setError(null);
    setSaving(true);
    try {
      await completeOnboarding({ ...identity, photoUrl, chosenTags: selected });
      // Profilul e salvat: RootNavigator trece singur la tab-uri.
    } catch (e) {
      setSaving(false);
      if (e instanceof UsernameTakenError) {
        // Cineva l-a luat între timp: înapoi la pasul 1, ca să alegi altul.
        Alert.alert(tr('Username-ul e deja luat'), tr('Între timp l-a ales altcineva. Alege altul.'), [
          { text: tr('OK'), onPress: () => navigation.popTo('OnboardingIdentity', { takenUsername: identity.username }) },
        ]);
        return;
      }
      console.warn('Nu am putut salva profilul:', e);
      setError('Nu am putut salva profilul. Verifică conexiunea și încearcă din nou.');
    }
  };

  // Username-ul nu se mai poate schimba: îl confirmăm înainte de salvare.
  const finish = () => {
    if (total < MIN_TAGS) {
      setError(tr('Alege cel puțin {MIN_TAGS} tag-uri, ca să-ți putem recomanda evenimente și oameni.', { MIN_TAGS: MIN_TAGS }));
      return;
    }
    Alert.alert(tr('Username-ul tău'), tr('Așa te vor găsi ceilalți: @{username}. Nu se mai poate schimba.', { username: identity.username }), [
      { text: tr('Schimb'), style: 'cancel', onPress: () => navigation.popTo('OnboardingIdentity') },
      { text: tr('Confirm'), onPress: () => void save() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScreenGlow />
      <ScrollView contentContainerStyle={styles.content}>
        <OnboardingHeader step={3} onBack={() => navigation.goBack()} />

        <View style={styles.heading}>
          <Text style={styles.title}>{tr('Ce îți place?')}</Text>
          <Text style={styles.subtitle}>{tr('Alege câteva tag-uri de pornire. Restul le învățăm din evenimentele la care mergi.')}</Text>
        </View>

        {TAG_GROUPS.map((group) => (
          <View key={group.id} style={styles.group}>
            <Text style={styles.label}>{group.label}</Text>
            <View style={styles.tags}>
              {group.tags.map((tag) => (
                <Chip key={tag} label={tag} active={selected[group.id].includes(tag)} onPress={() => toggle(group.id, tag)} />
              ))}
            </View>
          </View>
        ))}

        <View style={styles.bottom}>
          {error ? <FormMessage text={error} /> : null}
          <GradientButton
            label={saving ? tr('Se salvează…') : tr('Gata, hai în Crewd')}
            icon="sparkles"
            loading={saving}
            onPress={finish}
          />
          <Text style={styles.counter}>
            {total < MIN_TAGS ? tr('Mai alege {p}', { p: MIN_TAGS - total }) : `${total} tag-uri alese`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: 24, gap: 22 },
  heading: { gap: 8 },
  title: { ...type.screenTitle, fontSize: 36 },
  subtitle: { fontSize: 15, lineHeight: 22, color: colors.muted },
  group: { gap: 10 },
  label: { ...type.label },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bottom: { marginTop: 'auto', gap: 12 },
  counter: { alignSelf: 'center', color: colors.faint, fontSize: 13 },
});
